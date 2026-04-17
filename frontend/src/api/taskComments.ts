import { supabase } from '../lib/supabase';
import type { TaskComment } from '../types';
import { isLocalAppMode, LOCAL_DEV_USER_ID } from '../lib/localApp';

export async function listTaskComments(taskId: string): Promise<TaskComment[]> {
  if (isLocalAppMode()) {
    const res = await fetch(`/api/local/task-comments?task_ids=${encodeURIComponent(taskId)}`);
    const j = (await res.json()) as { comments?: TaskComment[] };
    if (!res.ok) throw new Error('Failed to load comments');
    return j.comments ?? [];
  }
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
  if (isLocalAppMode()) {
    const res = await fetch(`/api/local/task-comments?task_ids=${encodeURIComponent(taskIds.join(','))}`);
    const j = (await res.json()) as { comments?: TaskComment[] };
    if (!res.ok) throw new Error('Failed to load comments');
    return j.comments ?? [];
  }
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
  const trimmed = params.body.trim();
  if (!trimmed) {
    throw new Error('Comment cannot be empty');
  }

  if (isLocalAppMode()) {
    const res = await fetch('/api/local/task-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: params.taskId,
        user_id: LOCAL_DEV_USER_ID,
        body: trimmed,
        author_display_name: params.authorDisplayName,
      }),
    });
    const j = (await res.json()) as { comment?: TaskComment; error?: string };
    if (!res.ok) throw new Error(j.error || 'Failed to create comment');
    if (!j.comment) throw new Error('Invalid comment response');
    return j.comment as TaskComment;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('You must be signed in to comment');
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
  if (isLocalAppMode()) {
    const res = await fetch(`/api/local/task-comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    return;
  }
  const { error } = await supabase.from('task_comments').delete().eq('id', commentId);
  if (error) throw error;
}
