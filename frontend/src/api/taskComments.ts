import { supabase } from '../lib/supabase';
import type { TaskComment } from '../types';

export async function listTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TaskComment[];
}

export async function listTaskCommentsForTasks(taskIds: string[]): Promise<TaskComment[]> {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .in('task_id', taskIds)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as TaskComment[];
}

export async function createTaskComment(params: {
  taskId: string;
  body: string;
  authorDisplayName: string | null;
}): Promise<TaskComment> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('You must be signed in to comment');
  }

  const trimmed = params.body.trim();
  if (!trimmed) {
    throw new Error('Comment cannot be empty');
  }

  const { data, error } = await supabase
    .from('task_comments')
    .insert([
      {
        task_id: params.taskId,
        user_id: user.id,
        body: trimmed,
        author_display_name: params.authorDisplayName,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as TaskComment;
}

export async function deleteTaskComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
  if (error) throw error;
}
