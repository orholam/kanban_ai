import { supabase } from '../lib/supabase';
import type { Task } from '../types';
import { taskInsertPayload } from '../lib/taskDb';
import { isLocalAppMode } from '../lib/localApp';

export async function createTask(taskData: Task) {
  const payload = taskInsertPayload(taskData);

  try {
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
      return;
    }

    const { error } = await supabase.from('tasks').insert([payload]).select();

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/** Insert many tasks in one round-trip (Supabase) or in parallel (local). */
export async function createTasks(tasks: Task[]) {
  if (tasks.length === 0) return;

  if (isLocalAppMode()) {
    await Promise.all(tasks.map((t) => createTask(t)));
    return;
  }

  const payloads = tasks.map(taskInsertPayload);
  const { error } = await supabase.from('tasks').insert(payloads).select();
  if (error) {
    console.error('Error creating tasks:', error);
    throw error;
  }
}
