-- Track last modification time per task; keep created_at as-is (already used by the app).

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

UPDATE public.tasks
SET updated_at = COALESCE(
  updated_at,
  CASE
    WHEN created_at IS NOT NULL THEN created_at::timestamptz
    ELSE now()
  END
)
WHERE updated_at IS NULL;

ALTER TABLE public.tasks
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.tasks
  ALTER COLUMN updated_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_tasks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_set_updated_at ON public.tasks;

CREATE TRIGGER trg_tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_tasks_updated_at();
