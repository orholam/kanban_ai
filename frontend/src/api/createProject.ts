import { supabase } from '../lib/supabase';

interface ProjectData {
  id: string;
  title: string;
  description: string;
  master_plan: string;
  initial_prompt: string;
  keywords: string;
  num_sprints: number;
  current_sprint: number;
  complete: boolean;
  created_at: string;
  due_date: string;
  achievements: string;
  user_id: string;
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
    // First check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create a project');
    }
    
    // Validate mandatory fields
    if (!projectData.title || projectData.title.trim() === '') {
      throw new Error('Project title is required');
    }
    
    if (!projectData.description || projectData.description.trim() === '') {
      throw new Error('Project description is required');
    }
    
    // Ensure we only send fields that exist in the projects table
    const projectDataForInsert = {
      id: projectData.id,
      title: projectData.title.trim(),
      description: projectData.description.trim(),
      master_plan: projectData.master_plan,
      initial_prompt: projectData.initial_prompt,
      keywords: projectData.keywords,
      num_sprints: projectData.num_sprints,
      current_sprint: projectData.current_sprint,
      due_date: projectData.due_date,
      achievements: projectData.achievements,
      complete: projectData.complete,
      created_at: projectData.created_at,
      user_id: projectData.user_id
    };
    
    // Create the project without a specific owner field
    console.log('Inserting project data:', projectDataForInsert);
    console.log('Project data keys:', Object.keys(projectDataForInsert));
    const { data, error } = await supabase
      .from('projects')
      .insert([projectDataForInsert])
      .select();

    if (error) {
      console.error('Error creating project:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('Project created successfully:', data);
    
    // Set up the collaborator connection with the new project ID
    // This will establish the user as an owner/collaborator
    const projectId = data[0].id;
    const collaboratorData = {
      ...collaboratorConnectionData,
      project_id: projectId,
      user_id: user.id,
      role: collaboratorConnectionData.role || 'owner', // Default to owner if not specified
      accepted: true // The creator automatically accepts
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

    return { project: data[0], collaboratorConnection: collaboratorConnection[0] };
  } catch (error) {
    console.error('Error in createProject:', error);
    throw error;
  }
}

