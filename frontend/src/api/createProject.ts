import { supabase } from '../lib/supabase';

interface ProjectData {
  id: string;
  user_id: string;
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
}

export async function createProject(projectData: ProjectData) {
  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select();

  if (error) {
    console.error('Error creating project:', error);
  } else {
    console.log('Project created successfully:', data);
  }
}

