/** Stored on `task_comments.author_display_name` for AI-authored rows (same `user_id` as RLS). */
export const KANBAN_AI_COMMENT_AUTHOR = 'KanbanAI';

const LEGACY_AI_AUTHORS = new Set([KANBAN_AI_COMMENT_AUTHOR, 'Kanban AI']);

export function isKanbanAiCommentAuthor(name: string | null | undefined): boolean {
  return LEGACY_AI_AUTHORS.has((name ?? '').trim());
}

/** Normalize legacy "Kanban AI" rows to the current display label. */
export function displayTaskCommentAuthorName(name: string | null | undefined): string {
  if (isKanbanAiCommentAuthor(name)) return KANBAN_AI_COMMENT_AUTHOR;
  return name?.trim() || 'User';
}
