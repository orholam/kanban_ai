import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import { taskInsertPayload } from '../lib/taskDb';
import { isLocalAppMode } from '../lib/localApp';

export async function createTask(taskData: Task) {
  try {
    const payload = {
      ...taskInsertPayload(taskData),
      updated_at: taskData.updated_at || new Date().toISOString(),
    };

    if (isLocalAppMode()) {
      const res = await fetch('/api/local/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: payload }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(j.error || res.statusText || 'Failed to create task');
      }
      console.log('Task created successfully (local):', j);
      return;
    }

    const { data, error } = await supabase.from('tasks').insert([taskInsertPayload(taskData)]).select();

    if (error) {
      throw error;
    }

    console.log('Task created successfully:', data);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}
