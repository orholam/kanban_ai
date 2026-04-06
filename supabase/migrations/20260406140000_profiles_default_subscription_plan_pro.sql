-- New accounts default to Pro (e.g. beta / early access).
ALTER TABLE public.profiles
  ALTER COLUMN subscription_plan SET DEFAULT 'pro';

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
