-- Account-level roles and subscription tier (distinct from project_collaborators.role).
CREATE TYPE public.account_role AS ENUM ('owner', 'editor', 'admin');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  display_name text,
  name text,
  username text,
  account_role public.account_role NOT NULL DEFAULT 'admin',
  subscription_plan public.subscription_plan NOT NULL DEFAULT 'pro',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_subscription_plan_idx ON public.profiles (subscription_plan);

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_profiles_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name, name, username, account_role, subscription_plan)
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'username')), ''),
    'admin',
    'pro'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

INSERT INTO public.profiles (id, full_name, display_name, name, username, account_role, subscription_plan)
SELECT
  u.id,
  NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')), ''),
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name')), ''),
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'user_name', u.raw_user_meta_data->>'username')), ''),
  'admin',
  'pro'::public.subscription_plan
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
