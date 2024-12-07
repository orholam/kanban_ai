import { supabase } from '../lib/supabase'; // Ensure you have initialized Supabase client

interface TaskData {
  id: string;
  assignee_id: string;
  project_id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  sprint: number;
  due_date: string;
  created_at: string;
}

export async function createTask(taskData: TaskData) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select();

    if (error) {
      throw error;
    }

    console.log('Task created successfully:', data);
  } catch (error) {
    console.error('Error creating task:', error.message);
  }
}
