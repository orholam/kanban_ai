-- Guest browser analytics: stable session id without auth.users row.

ALTER TABLE public.analytics_events
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS guest_session_id text;

ALTER TABLE public.analytics_events
  DROP CONSTRAINT IF EXISTS analytics_events_subject_check;

ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_subject_check CHECK (
    (
      user_id IS NOT NULL
      AND guest_session_id IS NULL
    )
    OR (
      user_id IS NULL
      AND guest_session_id IS NOT NULL
      AND char_length(trim(guest_session_id)) >= 8
      AND char_length(trim(guest_session_id)) <= 128
    )
  );

CREATE INDEX IF NOT EXISTS analytics_events_guest_session_id_idx
  ON public.analytics_events (guest_session_id)
  WHERE guest_session_id IS NOT NULL;

DROP POLICY IF EXISTS "analytics_events_insert_non_owner_self" ON public.analytics_events;

CREATE POLICY "analytics_events_insert_non_owner_self"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND guest_session_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.account_role = 'owner'::public.account_role
    )
  );

CREATE POLICY "analytics_events_insert_guest_session"
  ON public.analytics_events FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND guest_session_id IS NOT NULL
    AND char_length(trim(guest_session_id)) >= 8
    AND char_length(trim(guest_session_id)) <= 128
  );

GRANT INSERT ON public.analytics_events TO anon;
