import { supabase } from '../lib/supabase'; // Ensure you have initialized Supabase client
import type { Task } from '../types';
import { taskInsertPayload } from '../lib/taskDb';

interface TaskData extends Task {}

export async function createTask(taskData: TaskData) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskInsertPayload(taskData)])
      .select();

    if (error) {
      throw error;
    }

    console.log('Task created successfully:', data);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}
