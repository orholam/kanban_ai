-- Normalize task created_at to timestamptz (full instants) alongside updated_at.

ALTER TABLE public.tasks
  ALTER COLUMN created_at TYPE timestamptz
  USING (
    CASE
      WHEN created_at IS NULL THEN now()
      ELSE created_at::timestamptz
    END
  );

UPDATE public.tasks
SET created_at = COALESCE(created_at, now())
WHERE created_at IS NULL;

ALTER TABLE public.tasks
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.tasks
  ALTER COLUMN created_at SET NOT NULL;
