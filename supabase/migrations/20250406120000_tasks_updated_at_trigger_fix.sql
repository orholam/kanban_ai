-- Recreate trigger with EXECUTE PROCEDURE (works on Postgres 11–13; EXECUTE FUNCTION is PG14+).
-- Fixes installs where the column was added but trigger creation failed.

DROP TRIGGER IF EXISTS trg_tasks_set_updated_at ON public.tasks;

CREATE OR REPLACE FUNCTION public.set_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_tasks_updated_at();
