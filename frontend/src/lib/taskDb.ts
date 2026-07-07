import { format, isValid, parseISO } from 'date-fns';
import type { Task } from '../types';

/**
 * Parse instants from Postgres/PostgREST (`created_at`, `updated_at`, comment times).
 * Date-only `YYYY-MM-DD` is treated as local calendar date at midnight (legacy rows).
 */
export function parseDbTimestamp(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = parseISO(value.trim());
  return isValid(d) ? d : null;
}

/** Legacy rows may still store calendar dates without a time component. */
export function isDateOnlyTimestamp(value: string | undefined): boolean {
  return Boolean(value?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(value.trim()));
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

/** PostgREST insert body — omit timestamps so DB defaults (`now()`) apply. */
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
  };
}

export type MergeTaskOptions = {
  /**
   * Legacy fallback when the API returns date-only `updated_at` (pre-migration rows).
   */
  bumpUpdatedAtFromClient?: boolean;
};

function resolveUpdatedAt(
  row: Partial<Task>,
  fallback: Task,
  opts?: MergeTaskOptions
): string {
  const fromRow = firstNonEmptyString(row.updated_at);
  if (fromRow && !isDateOnlyTimestamp(fromRow)) return fromRow;

  if (opts?.bumpUpdatedAtFromClient) return new Date().toISOString();

  const fromFallback = firstNonEmptyString(fallback.updated_at);
  if (fromFallback && !isDateOnlyTimestamp(fromFallback)) return fromFallback;

  const fromCreated =
    firstNonEmptyString(row.created_at) ?? firstNonEmptyString(fallback.created_at);
  if (fromCreated && !isDateOnlyTimestamp(fromCreated)) return fromCreated;

  return new Date().toISOString();
}

function resolveCreatedAt(row: Partial<Task>, fallback: Task): string {
  const fromRow = firstNonEmptyString(row.created_at);
  if (fromRow) return fromRow;
  const fromFallback = firstNonEmptyString(fallback.created_at);
  if (fromFallback) return fromFallback;
  return new Date().toISOString();
}

/**
 * Merge a PostgREST row into the client task.
 * Prefer server timestamps; bump client `updated_at` only for legacy date-only API responses.
 */
export function mergeTaskWithDbRow(
  fallback: Task,
  row: Partial<Task> & Pick<Task, 'id'>,
  opts?: MergeTaskOptions
): Task {
  const legacyDateOnly =
    isDateOnlyTimestamp(row.updated_at) || isDateOnlyTimestamp(row.created_at);
  const bump = opts?.bumpUpdatedAtFromClient || legacyDateOnly;

  const dueNorm =
    row.due_date != null && String(row.due_date).trim() !== ''
      ? formatDueDateForDb(parseTaskDueDate(String(row.due_date)))
      : undefined;

  return {
    ...fallback,
    ...row,
    created_at: resolveCreatedAt(row, fallback),
    updated_at: resolveUpdatedAt(row, fallback, bump ? { bumpUpdatedAtFromClient: true } : undefined),
    ...(dueNorm !== undefined ? { due_date: dueNorm } : {}),
  };
}
