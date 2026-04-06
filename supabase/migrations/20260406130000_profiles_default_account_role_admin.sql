-- Default signup: admin. `owner` is reserved for the app operator (set manually in SQL).
ALTER TABLE public.profiles
  ALTER COLUMN account_role SET DEFAULT 'admin';

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

UPDATE public.profiles
SET account_role = 'admin'
WHERE account_role = 'owner';
