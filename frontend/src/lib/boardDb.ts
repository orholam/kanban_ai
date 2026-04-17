/**
 * Data access for the kanban app: Supabase (hosted) vs local SQLite API (`/api/local/*`).
 */
import { supabase } from './supabase';
import { isLocalAppMode } from './localApp';
import type { Project, Task } from '../types';
import { mergeTaskWithDbRow, taskInsertPayload } from './taskDb';

const LOCAL = '/api/local';

async function localJson<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${LOCAL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string>),
    },
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(t || r.statusText);
  }
  return r.json() as Promise<T>;
}

function mapCollabProjectsToAppShape(
  collaborations: {
    project_id: string;
    projects: Record<string, unknown> | null;
  }[]
): Project[] {
  return collaborations
    .map((collaboration) => {
      const project = collaboration.projects;
      if (!project) return null;
      return {
        ...project,
        master_plan: '',
        initial_prompt: '',
        achievements: '',
        notes: '',
        projectType: (project.projectType as string) || 'Manual',
        private: (project.private as boolean | undefined) ?? true,
        tasks: [],
      } as Project;
    })
    .filter((p): p is Project => p !== null);
}

export async function loadSidebarProjects(userId: string): Promise<Project[]> {
  if (isLocalAppMode()) {
    const { projects } = await localJson<{ projects: Project[] }>(
      `/workspace?user_id=${encodeURIComponent(userId)}`
    );
    return projects;
  }

  const { data: collaborations, error } = await supabase
    .from('project_collaborators')
    .select(
      `
            project_id,
            projects (
              id,
              title,
              description,
              keywords,
              num_sprints,
              current_sprint,
              due_date,
              complete,
              created_at,
              user_id,
              private,
              projectType
            )
          `
    )
    .eq('user_id', userId)
    .eq('accepted', true);

  if (error) throw error;
  return mapCollabProjectsToAppShape((collaborations ?? []) as Parameters<typeof mapCollabProjectsToAppShape>[0]);
}

export async function deleteProjectCascade(projectId: string): Promise<void> {
  if (isLocalAppMode()) {
    await localJson(`/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
    return;
  }
  const { error: tasksErr } = await supabase.from('tasks').delete().eq('project_id', projectId);
  if (tasksErr) throw tasksErr;
  const { error: collabErr } = await supabase
    .from('project_collaborators')
    .delete()
    .eq('project_id', projectId);
  if (collabErr) throw collabErr;
  const { error: projectErr } = await supabase.from('projects').delete().eq('id', projectId);
  if (projectErr) throw projectErr;
}

export async function fetchTasksForProject(projectId: string): Promise<Task[]> {
  if (isLocalAppMode()) {
    const { tasks } = await localJson<{ tasks: Task[] }>(`/projects/${encodeURIComponent(projectId)}/tasks`);
    return tasks;
  }
  const { data: fetchedTasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (fetchedTasks ?? []) as Task[];
}

export async function insertTaskRow(task: Task): Promise<Task> {
  if (isLocalAppMode()) {
    const { task: row } = await localJson<{ task: Task }>(`/tasks`, {
      method: 'POST',
      body: JSON.stringify({ task: { ...taskInsertPayload(task), updated_at: task.updated_at } }),
    });
    return mergeTaskWithDbRow(task, row);
  }
  const { data, error } = await supabase.from('tasks').insert([taskInsertPayload(task)]).select();
  if (error) throw error;
  const row0 = (data ?? [])[0] as Task;
  return mergeTaskWithDbRow(task, row0);
}

export async function updateTaskRow(
  taskId: string,
  patch: Partial<Pick<Task, 'title' | 'description' | 'type' | 'priority' | 'status' | 'sprint' | 'due_date'>>,
  mergeBase: Task
): Promise<Task> {
  if (isLocalAppMode()) {
    const { task: row } = await localJson<{ task: Task }>(`/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return mergeTaskWithDbRow(mergeBase, row, { bumpUpdatedAtFromClient: true });
  }
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', taskId).select();
  if (error) throw error;
  const row0 = (data ?? [])[0] as Task;
  return mergeTaskWithDbRow(mergeBase, row0, { bumpUpdatedAtFromClient: true });
}

export async function updateTaskRowReturnArray(
  taskId: string,
  patch: Record<string, unknown>,
  mergeBase: Task
): Promise<{ merged: Task; data0: Task }> {
  if (isLocalAppMode()) {
    const { task: row } = await localJson<{ task: Task }>(`/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    const merged = mergeTaskWithDbRow(mergeBase, row, { bumpUpdatedAtFromClient: true });
    return { merged, data0: row };
  }
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', taskId).select();
  if (error) throw error;
  const row = (data ?? [])[0] as Task;
  const merged = mergeTaskWithDbRow(mergeBase, row, { bumpUpdatedAtFromClient: true });
  return { merged, data0: row };
}

export async function deleteTaskRow(taskId: string): Promise<void> {
  if (isLocalAppMode()) {
    await localJson(`/tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' });
    return;
  }
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function updateProjectRow(
  projectId: string,
  updates: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (isLocalAppMode()) {
    const { project } = await localJson<{ project: Record<string, unknown> }>(
      `/projects/${encodeURIComponent(projectId)}`,
      { method: 'PATCH', body: JSON.stringify(updates) }
    );
    return project;
  }
  const { data, error } = await supabase.from('projects').update(updates).eq('id', projectId).select().single();
  if (error) throw error;
  return data as Record<string, unknown>;
}

/** Long text / notes fields not loaded in the sidebar project list. */
export async function fetchProjectMetaFields(
  projectId: string
): Promise<Pick<Project, 'master_plan' | 'initial_prompt' | 'achievements' | 'notes'> | null> {
  if (isLocalAppMode()) {
    try {
      const { project } = await localJson<{ project: Record<string, unknown> }>(
        `/projects/${encodeURIComponent(projectId)}`
      );
      return {
        master_plan: String(project.master_plan ?? ''),
        initial_prompt: String(project.initial_prompt ?? ''),
        achievements: String(project.achievements ?? ''),
        notes: String(project.notes ?? ''),
      };
    } catch {
      return null;
    }
  }
  const { data, error } = await supabase
    .from('projects')
    .select('master_plan, initial_prompt, achievements, notes')
    .eq('id', projectId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Pick<Project, 'master_plan' | 'initial_prompt' | 'achievements' | 'notes'>;
}

export async function fetchPublicProjectRow(projectId: string): Promise<Record<string, unknown> | null> {
  if (isLocalAppMode()) {
    try {
      const { project } = await localJson<{ project: Record<string, unknown> }>(
        `/public/projects/${encodeURIComponent(projectId)}`
      );
      return project;
    } catch {
      return null;
    }
  }
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('private', false)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Record<string, unknown>;
}
