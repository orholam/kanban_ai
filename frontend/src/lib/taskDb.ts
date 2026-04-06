import { format, isValid, parseISO } from 'date-fns';
import type { Task } from '../types';

/**
 * Parse instants from Postgres/PostgREST (`created_at`, `updated_at`, comment times).
 * Date-only `YYYY-MM-DD` is treated as local calendar date at midnight (date-fns parseISO).
 */
export function parseDbTimestamp(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = parseISO(value.trim());
  return isValid(d) ? d : null;
}

/**
 * Due date is a calendar day, not a UTC instant. Never use `new Date('YYYY-MM-DD')` or save with `toISOString()`
 * — both shift the day in US timezones.
 */
export function parseTaskDueDate(value: string | undefined): Date {
  const fallback = new Date();
  if (!value?.trim()) return fallback;
  const s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    const local = new Date(y, m - 1, d);
    return Number.isNaN(local.getTime()) ? fallback : local;
  }
  const parsed = parseISO(s);
  if (!isValid(parsed)) return fallback;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/** Persist due date as local calendar `YYYY-MM-DD` (matches date columns and CreateTaskModal). */
export function formatDueDateForDb(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function firstNonEmptyString(
  ...vals: (string | null | undefined)[]
): string | undefined {
  for (const v of vals) {
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

/** PostgREST insert body: DB columns only; no `updated_at` so older DBs without that column still accept inserts. */
export function taskInsertPayload(task: Task) {
  return {
    id: task.id,
    project_id: task.project_id,
    title: task.title,
    description: task.description,
    type: task.type,
    priority: task.priority,
    status: task.status,
    sprint: task.sprint,
    due_date: task.due_date,
    assignee_id: task.assignee_id,
    created_at: task.created_at,
  };
}

export type MergeTaskOptions = {
  /**
   * Use after a successful `.update()` when the API/DB only returns a calendar date or midnight
   * for `updated_at` — so the modal shows a real “just now” instead of matching `created_at`.
   */
  bumpUpdatedAtFromClient?: boolean;
};

/**
 * Merge a PostgREST row into the client task.
 * Prefer server `updated_at` unless `bumpUpdatedAtFromClient` (post-mutation) is set.
 */
export function mergeTaskWithDbRow(
  fallback: Task,
  row: Partial<Task> & Pick<Task, 'id'>,
  opts?: MergeTaskOptions
): Task {
  const updated_at = opts?.bumpUpdatedAtFromClient
    ? new Date().toISOString()
    : firstNonEmptyString(row.updated_at) ??
      firstNonEmptyString(fallback.updated_at) ??
      firstNonEmptyString(row.created_at) ??
      firstNonEmptyString(fallback.created_at) ??
      new Date().toISOString();

  const dueNorm =
    row.due_date != null && String(row.due_date).trim() !== ''
      ? formatDueDateForDb(parseTaskDueDate(String(row.due_date)))
      : undefined;

  return {
    ...fallback,
    ...row,
    updated_at,
    ...(dueNorm !== undefined ? { due_date: dueNorm } : {}),
  };
}
