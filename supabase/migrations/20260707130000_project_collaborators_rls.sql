-- Project collaborators: one row per user per project, member-scoped RLS.

ALTER TABLE public.project_collaborators
  DROP CONSTRAINT IF EXISTS project_collaborators_project_id_user_id_key;

ALTER TABLE public.project_collaborators
  ADD CONSTRAINT project_collaborators_project_id_user_id_key UNIQUE (project_id, user_id);

ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_collaborators_select" ON public.project_collaborators;
DROP POLICY IF EXISTS "project_collaborators_insert_owner" ON public.project_collaborators;
DROP POLICY IF EXISTS "project_collaborators_delete_owner" ON public.project_collaborators;

-- Members (owner or accepted collaborator) can list collaborators on their project.
CREATE POLICY "project_collaborators_select"
ON public.project_collaborators
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_collaborators.project_id
    AND (
      p.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.project_collaborators pc
        WHERE pc.project_id = p.id
        AND pc.user_id = auth.uid()
        AND pc.accepted = true
      )
    )
  )
);

-- Project owner may add their own owner row when creating a project.
CREATE POLICY "project_collaborators_insert_owner"
ON public.project_collaborators
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND role = 'owner'
  AND accepted = true
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_collaborators.project_id
    AND p.user_id = auth.uid()
  )
);

-- Project owner may remove editor members (not owner rows).
CREATE POLICY "project_collaborators_delete_owner"
ON public.project_collaborators
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_collaborators.project_id
    AND p.user_id = auth.uid()
  )
  AND role <> 'owner'
);

GRANT SELECT, INSERT, DELETE ON public.project_collaborators TO authenticated;
