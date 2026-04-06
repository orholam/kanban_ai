-- Task comments: one row per comment, cascade with tasks
CREATE TABLE public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX task_comments_task_id_created_at_idx ON public.task_comments (task_id, created_at);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Read: public project, or authenticated owner / accepted collaborator
CREATE POLICY "task_comments_select"
ON public.task_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    WHERE t.id = task_comments.task_id
    AND (
      p.private = false
      OR (auth.uid() IS NOT NULL AND p.user_id = auth.uid())
      OR (
        auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.accepted = true
        )
      )
    )
  )
);

-- Write: owner or accepted collaborator only
CREATE POLICY "task_comments_insert"
ON public.task_comments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    WHERE t.id = task_comments.task_id
    AND (
      p.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = p.id
        AND pc.user_id = auth.uid()
        AND pc.accepted = true
      )
    )
  )
);

CREATE POLICY "task_comments_delete"
ON public.task_comments
FOR DELETE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    WHERE t.id = task_comments.task_id
    AND (
      p.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.project_collaborators pc
        WHERE pc.project_id = p.id
        AND pc.user_id = auth.uid()
        AND pc.accepted = true
      )
    )
  )
);

GRANT SELECT ON public.task_comments TO anon, authenticated;
GRANT INSERT, DELETE ON public.task_comments TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
