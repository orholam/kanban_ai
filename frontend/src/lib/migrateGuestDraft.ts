import { v4 as uuidv4 } from 'uuid';
import type { User } from '@supabase/supabase-js';
import { createProject } from '../api/createProject';
import { createTask } from '../api/createTask';
import type { GuestDraft } from './guestDraft';
import type { Project } from '../types';

export async function migrateGuestDraft(
  user: User,
  draft: GuestDraft
): Promise<Project> {
  const project_id = uuidv4();
  const now = new Date().toISOString();
  const due = new Date();
  due.setDate(due.getDate() + 7);

  const newProject = {
    id: project_id,
    title: draft.project.title.trim() || 'My board',
    description:
      draft.project.description.trim() ||
      'Imported from your try-before-sign-up board.',
    master_plan: draft.project.master_plan || '',
    initial_prompt: draft.project.initial_prompt || draft.project.description || '',
    keywords: draft.project.keywords || '',
    projectType: draft.project.projectType || 'Manual',
    num_sprints: draft.project.num_sprints || 10,
    current_sprint: draft.project.current_sprint || 1,
    complete: false,
    created_at: now,
    due_date: draft.project.due_date || due.toISOString(),
    achievements: draft.project.achievements || '',
    user_id: user.id,
    private: true,
    notes: draft.project.notes ?? '',
  };

  const collaborator = {
    id: uuidv4(),
    project_id,
    user_id: user.id,
    invited_at: now,
    accepted: true,
    role: 'owner',
  };

  const { project } = await createProject(newProject, collaborator);

  for (const task of draft.tasks) {
    const created = task.created_at || now;
    const row = {
      id: uuidv4(),
      project_id: project.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
      sprint: task.sprint,
      due_date: task.due_date,
      created_at: created,
      updated_at: task.updated_at || created,
      assignee_id: user.id,
    };
    await createTask(row);
  }

  return { ...project, tasks: [] } as Project;
}
