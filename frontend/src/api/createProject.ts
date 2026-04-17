import { supabase } from '../lib/supabase';
import { isLocalAppMode } from '../lib/localApp';

interface ProjectData {
  id: string;
  title: string;
  description: string;
  master_plan: string;
  initial_prompt: string;
  keywords: string;
  projectType: string; // Add this field
  num_sprints: number;
  current_sprint: number;
  complete: boolean;
  created_at: string;
  due_date: string;
  achievements: string;
  user_id: string;
  private?: boolean; // Add private field
  notes?: string; // Add notes field
}

interface CollaboratorConnectionData {
  id: string;
  project_id: string;
  user_id: string;
  invited_at: string;
  accepted: boolean;
  role: string;
}

export async function createProject(projectData: ProjectData, collaboratorConnectionData: CollaboratorConnectionData) {
  try {
    if (!projectData.title || projectData.title.trim() === '') {
      throw new Error('Project title is required');
    }

    if (!projectData.description || projectData.description.trim() === '') {
      throw new Error('Project description is required');
    }

    const projectDataForInsert = {
      id: projectData.id,
      title: projectData.title.trim(),
      description: projectData.description.trim(),
      master_plan: projectData.master_plan,
      initial_prompt: projectData.initial_prompt,
      keywords: projectData.keywords,
      projectType: projectData.projectType,
      num_sprints: projectData.num_sprints,
      current_sprint: projectData.current_sprint,
      due_date: projectData.due_date,
      achievements: projectData.achievements,
      complete: projectData.complete,
      created_at: projectData.created_at,
      user_id: projectData.user_id,
      private: projectData.private ?? true,
      notes: projectData.notes,
    };

    if (isLocalAppMode()) {
      if (!projectData.user_id.trim()) {
        throw new Error('User must be authenticated to create a project');
      }
      const collaboratorPayload = {
        ...collaboratorConnectionData,
        project_id: projectData.id,
        user_id: projectData.user_id,
        role: collaboratorConnectionData.role || 'owner',
        accepted: true,
      };
      const res = await fetch('/api/local/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: projectDataForInsert,
          collaborator: collaboratorPayload,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { project?: Record<string, unknown>; error?: string };
      if (!res.ok) {
        throw new Error(j.error || res.statusText || 'Failed to create project');
      }
      if (!j.project) throw new Error('Invalid response from local API');
      return {
        project: j.project,
        collaboratorConnection: collaboratorPayload,
      };
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to create a project');
    }

    console.log('Inserting project data:', projectDataForInsert);
    console.log('Project data keys:', Object.keys(projectDataForInsert));
    const { data, error } = await supabase.from('projects').insert([projectDataForInsert]).select();

    if (error) {
      console.error('Error creating project:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('Project created successfully:', data);

    const projectId = data![0].id;
    const collaboratorData = {
      ...collaboratorConnectionData,
      project_id: projectId,
      user_id: user.id,
      role: collaboratorConnectionData.role || 'owner',
      accepted: true,
    };

    const { data: collaboratorConnection, error: collaboratorConnectionError } = await supabase
      .from('project_collaborators')
      .insert([collaboratorData])
      .select();

    if (collaboratorConnectionError) {
      console.error('Error creating collaborator connection:', collaboratorConnectionError);
      throw collaboratorConnectionError;
    }

    console.log('Collaborator connection created successfully:', collaboratorConnection);

    return { project: data![0], collaboratorConnection: collaboratorConnection![0] };
  } catch (error) {
    console.error('Error in createProject:', error);
    throw error;
  }
}
