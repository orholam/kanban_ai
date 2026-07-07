-- Task RLS was tied to `assignee_id`, which blocked reassigning a task to
-- anyone other than the current user (the UPDATE WITH CHECK required
-- `auth.uid() = assignee_id`). Move task writes to project membership so the
-- owner and accepted collaborators can create, edit, reassign, and delete
-- tasks on their shared projects.

-- SECURITY DEFINER helper bypasses RLS on projects / project_collaborators so
-- the check works even where those tables have RLS enabled, and avoids
-- recursive policy evaluation.
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = p_project_id
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
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;

-- Replace assignee-scoped write policies with project-membership policies.
DROP POLICY IF EXISTS "Allow insert if user is signed in and matches auth.uid()" ON public.tasks;
DROP POLICY IF EXISTS "Allow update if user is signed in and matches auth.uid()" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete if user is signed in and matches auth.uid()" ON public.tasks;

DROP POLICY IF EXISTS "tasks_insert_project_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_project_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_project_member" ON public.tasks;

CREATE POLICY "tasks_insert_project_member"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "tasks_update_project_member"
ON public.tasks
FOR UPDATE
TO authenticated
USING (public.is_project_member(project_id))
WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "tasks_delete_project_member"
ON public.tasks
FOR DELETE
TO authenticated
USING (public.is_project_member(project_id));
