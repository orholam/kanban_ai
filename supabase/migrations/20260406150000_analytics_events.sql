-- First-party product analytics: single event stream (baseline).

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT analytics_events_event_type_check CHECK (
    event_type IN ('sign_up', 'sign_in', 'ai_interaction', 'task_write')
  )
);

CREATE INDEX analytics_events_created_at_idx ON public.analytics_events (created_at DESC);
CREATE INDEX analytics_events_user_id_idx ON public.analytics_events (user_id);
CREATE INDEX analytics_events_event_type_idx ON public.analytics_events (event_type);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_events_select_owner"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.account_role = 'owner'::public.account_role
    )
  );

CREATE POLICY "analytics_events_insert_non_owner_self"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.account_role = 'owner'::public.account_role
    )
  );

GRANT SELECT ON public.analytics_events TO authenticated;
GRANT INSERT ON public.analytics_events TO authenticated;

-- Sign-up: log after profile row exists (skip app operator role).
CREATE OR REPLACE FUNCTION public.trg_analytics_on_profile_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_role = 'owner'::public.account_role THEN
    RETURN NEW;
  END IF;
  BEGIN
    INSERT INTO public.analytics_events (user_id, event_type, metadata)
    VALUES (NEW.id, 'sign_up', '{}'::jsonb);
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_analytics_signup ON public.profiles;
CREATE TRIGGER trg_profiles_analytics_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_analytics_on_profile_signup();

-- Task mutations: attribute to JWT user; skip operator accounts.
CREATE OR REPLACE FUNCTION public.trg_analytics_on_task_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  tid uuid;
  pid uuid;
  op text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.account_role = 'owner'::public.account_role
  ) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'DELETE' THEN
    op := 'DELETE';
    tid := OLD.id;
    pid := OLD.project_id;
  ELSE
    op := TG_OP;
    tid := NEW.id;
    pid := NEW.project_id;
  END IF;

  BEGIN
    INSERT INTO public.analytics_events (user_id, event_type, metadata)
    VALUES (
      uid,
      'task_write',
      jsonb_build_object('task_id', tid, 'project_id', pid, 'op', op)
    );
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_analytics_write ON public.tasks;
CREATE TRIGGER trg_tasks_analytics_write
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.trg_analytics_on_task_write();
