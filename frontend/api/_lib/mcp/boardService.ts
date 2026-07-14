import { v4 as uuidv4 } from 'uuid';
import { getMcpContext } from './requestContext.js';

/** Enforces project membership (needed when auth uses service-role for API keys). */
async function assertProjectMember(projectId: string): Promise<{ ownerId: string }> {
  const { supabase, userId } = getMcpContext();

  const { data: collab, error: collabError } = await supabase
    .from('project_collaborators')
    .select('id, projects ( user_id )')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('accepted', true)
    .maybeSingle();
  if (collabError) throw collabError;

  if (collab) {
    const nested = collab.projects as { user_id: string } | { user_id: string }[] | null;
    const owner =
      (Array.isArray(nested) ? nested[0]?.user_id : nested?.user_id) != null
        ? String(Array.isArray(nested) ? nested[0]?.user_id : nested?.user_id)
        : userId;
    return { ownerId: owner };
  }

  const { data: owned, error: ownedError } = await supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  if (ownedError) throw ownedError;
  if (owned) return { ownerId: userId };

  throw new Error(`Project ${projectId} not found`);
}

async function assertTaskAccess(taskId: string): Promise<{ projectId: string }> {
  const { supabase } = getMcpContext();
  const { data: task, error } = await supabase
    .from('tasks')
    .select('id, project_id')
    .eq('id', taskId)
    .maybeSingle();
  if (error) throw error;
  if (!task) throw new Error(`Task ${taskId} not found`);
  await assertProjectMember(String(task.project_id));
  return { projectId: String(task.project_id) };
}

async function assertCommentAccess(commentId: string): Promise<void> {
  const { supabase, userId } = getMcpContext();
  const { data: comment, error } = await supabase
    .from('task_comments')
    .select('id, task_id, user_id')
    .eq('id', commentId)
    .maybeSingle();
  if (error) throw error;
  if (!comment) throw new Error(`Comment ${commentId} not found`);
  if (String(comment.user_id) !== userId) {
    throw new Error('Only the comment author can delete this comment');
  }
  await assertTaskAccess(String(comment.task_id));
}

export type BoardTask = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  sprint: number;
  due_date: string;
  assignee_id: string;
  created_at: string;
  updated_at?: string;
};

export type BoardProject = {
  id: string;
  title: string;
  description: string;
  master_plan?: string;
  initial_prompt?: string;
  keywords?: string;
  projectType?: string;
  num_sprints?: number;
  current_sprint?: number;
  due_date?: string;
  achievements?: string;
  complete?: boolean;
  created_at?: string;
  user_id?: string;
  private?: boolean;
  notes?: string;
};

export type BoardTaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  author_display_name: string | null;
  created_at: string;
};

function mapSidebarProjects(
  collaborations: {
    project_id: string;
    projects: Record<string, unknown> | null;
  }[]
): BoardProject[] {
  return collaborations
    .map((collaboration) => {
      const project = collaboration.projects;
      if (!project) return null;
      return {
        id: String(project.id),
        title: String(project.title ?? ''),
        description: String(project.description ?? ''),
        keywords: project.keywords != null ? String(project.keywords) : undefined,
        projectType: project.projectType != null ? String(project.projectType) : 'Manual',
        num_sprints: project.num_sprints != null ? Number(project.num_sprints) : undefined,
        current_sprint: project.current_sprint != null ? Number(project.current_sprint) : undefined,
        due_date: project.due_date != null ? String(project.due_date) : undefined,
        complete: project.complete != null ? Boolean(project.complete) : undefined,
        created_at: project.created_at != null ? String(project.created_at) : undefined,
        user_id: project.user_id != null ? String(project.user_id) : undefined,
        private: project.private != null ? Boolean(project.private) : true,
      } satisfies BoardProject;
    })
    .filter((p): p is BoardProject => p !== null);
}

export async function listProjects(): Promise<BoardProject[]> {
  const { supabase, userId } = getMcpContext();
  const { data, error } = await supabase
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
  return mapSidebarProjects((data ?? []) as Parameters<typeof mapSidebarProjects>[0]);
}

export async function getProject(projectId: string): Promise<BoardProject | null> {
  await assertProjectMember(projectId);
  const { supabase } = getMcpContext();
  const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
  if (error) throw error;
  return (data as BoardProject | null) ?? null;
}

export async function getProjectWithTasks(projectId: string): Promise<{
  project: BoardProject | null;
  tasks: BoardTask[];
}> {
  const [project, tasks] = await Promise.all([getProject(projectId), listTasks(projectId)]);
  return { project, tasks };
}

export async function listTasks(projectId: string): Promise<BoardTask[]> {
  await assertProjectMember(projectId);
  const { supabase } = getMcpContext();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as BoardTask[];
}

export async function createProject(input: {
  title: string;
  description: string;
  projectType?: string;
  num_sprints?: number;
  private?: boolean;
  master_plan?: string;
  initial_prompt?: string;
  keywords?: string;
  notes?: string;
}): Promise<BoardProject> {
  const { supabase, userId } = getMcpContext();
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) throw new Error('Project title is required');
  if (!description) throw new Error('Project description is required');

  const projectId = uuidv4();
  const now = new Date().toISOString();
  const projectRow = {
    id: projectId,
    title,
    description,
    master_plan: input.master_plan ?? '',
    initial_prompt: input.initial_prompt ?? '',
    keywords: input.keywords ?? '',
    projectType: input.projectType ?? 'Manual',
    num_sprints: input.num_sprints ?? 10,
    current_sprint: 1,
    due_date: null,
    achievements: '',
    complete: false,
    created_at: now,
    user_id: userId,
    private: input.private ?? true,
    notes: input.notes ?? '',
  };

  const { data: projects, error: projectError } = await supabase.from('projects').insert([projectRow]).select();
  if (projectError) throw projectError;

  const collaborator = {
    id: uuidv4(),
    project_id: projectId,
    user_id: userId,
    invited_at: now,
    accepted: true,
    role: 'owner',
  };

  const { error: collabError } = await supabase.from('project_collaborators').insert([collaborator]);
  if (collabError) throw collabError;

  return projects![0] as BoardProject;
}

export async function updateProject(
  projectId: string,
  updates: Partial<
    Pick<
      BoardProject,
      | 'title'
      | 'description'
      | 'master_plan'
      | 'initial_prompt'
      | 'keywords'
      | 'projectType'
      | 'num_sprints'
      | 'current_sprint'
      | 'due_date'
      | 'achievements'
      | 'complete'
      | 'private'
      | 'notes'
    >
  >
): Promise<BoardProject> {
  await assertProjectMember(projectId);
  const { supabase } = getMcpContext();
  const { data, error } = await supabase.from('projects').update(updates).eq('id', projectId).select().single();
  if (error) throw error;
  return data as BoardProject;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { ownerId } = await assertProjectMember(projectId);
  const { supabase, userId } = getMcpContext();
  if (ownerId !== userId) {
    throw new Error('Only the project owner can delete this project');
  }
  const { error: tasksErr } = await supabase.from('tasks').delete().eq('project_id', projectId);
  if (tasksErr) throw tasksErr;
  const { error: collabErr } = await supabase.from('project_collaborators').delete().eq('project_id', projectId);
  if (collabErr) throw collabErr;
  const { error: projectErr } = await supabase.from('projects').delete().eq('id', projectId);
  if (projectErr) throw projectErr;
}

export async function createTask(input: {
  project_id: string;
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  sprint?: number;
  due_date?: string;
}): Promise<BoardTask> {
  await assertProjectMember(input.project_id);
  const { supabase, userId } = getMcpContext();
  const title = input.title.trim();
  if (!title) throw new Error('Task title is required');

  const now = new Date().toISOString();
  const due =
    input.due_date && /^\d{4}-\d{2}-\d{2}$/.test(input.due_date)
      ? input.due_date
      : now.slice(0, 10);

  const row = {
    id: uuidv4(),
    project_id: input.project_id,
    title,
    description: input.description ?? '',
    type: input.type ?? 'feature',
    priority: input.priority ?? 'medium',
    status: input.status ?? 'todo',
    sprint: input.sprint ?? 1,
    due_date: due,
    assignee_id: userId,
  };

  const { data, error } = await supabase.from('tasks').insert([row]).select().single();
  if (error) throw error;
  return data as BoardTask;
}

export async function updateTask(
  taskId: string,
  patch: Partial<Pick<BoardTask, 'title' | 'description' | 'type' | 'priority' | 'status' | 'sprint' | 'due_date'>>
): Promise<BoardTask> {
  await assertTaskAccess(taskId);
  const { supabase } = getMcpContext();
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', taskId).select().single();
  if (error) throw error;
  return data as BoardTask;
}

export async function deleteTask(taskId: string): Promise<void> {
  await assertTaskAccess(taskId);
  const { supabase } = getMcpContext();
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function listTaskComments(taskId: string): Promise<BoardTaskComment[]> {
  await assertTaskAccess(taskId);
  const { supabase } = getMcpContext();
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as BoardTaskComment[];
}

export async function addTaskComment(input: {
  task_id: string;
  body: string;
  author_display_name?: string | null;
}): Promise<BoardTaskComment> {
  await assertTaskAccess(input.task_id);
  const { supabase, userId } = getMcpContext();
  const body = input.body.trim();
  if (!body) throw new Error('Comment cannot be empty');

  const { data, error } = await supabase
    .from('task_comments')
    .insert([
      {
        task_id: input.task_id,
        user_id: userId,
        body,
        author_display_name: input.author_display_name ?? 'MCP Agent',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as BoardTaskComment;
}

export async function deleteTaskComment(commentId: string): Promise<void> {
  await assertCommentAccess(commentId);
  const { supabase } = getMcpContext();
  const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
  if (error) throw error;
}

export async function getBoardContextJson(projectId: string): Promise<string> {
  const { project, tasks } = await getProjectWithTasks(projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const commentsByTask = await Promise.all(
    tasks.map(async (task) => ({
      taskId: task.id,
      comments: await listTaskComments(task.id),
    }))
  );

  const tasksWithComments = tasks.map((task) => ({
    ...task,
    comments: commentsByTask.find((c) => c.taskId === task.id)?.comments ?? [],
  }));

  return JSON.stringify(
    {
      project,
      tasks: tasksWithComments,
    },
    null,
    2
  );
}
