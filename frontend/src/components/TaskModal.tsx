import React, { lazy, Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, User, Trash2, ArrowUp, Loader2, Sparkles } from 'lucide-react';
import type { Task, TaskComment, Status } from '../types';

const TaskModalCalendar = lazy(() => import('./TaskModalCalendar'));
import TextareaAutosize from 'react-textarea-autosize';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { parseDbTimestamp, parseTaskDueDate } from '../lib/taskDb';
import { useAuth } from '../contexts/AuthContext';
import { getDisplayName, getUserInitials } from '../lib/userUtils';
import { supabase } from '../lib/supabase';
import { fetchProfileDisplayName } from '../lib/profileDisplayName';
import {
  listTaskComments,
  createTaskComment,
  deleteTaskComment,
} from '../api/taskComments';
import { generateKanbanTaskCommentReply } from '../lib/openai';
import {
  KANBAN_AI_COMMENT_AUTHOR,
  displayTaskCommentAuthorName,
} from '../lib/kanbanAiComment';
import { TaskCommentAuthorAvatar } from './TaskCommentAuthorAvatar';
import { toast } from 'sonner';

const KANBAN_MENTION_TOKEN = 'kanban';

/**
 * `created_at` / `updated_at` from Postgres may be date-only (`YYYY-MM-DD`) or `date` columns — no time of day.
 * Distance-from-midnight reads as “~24 hours ago”; show a calendar label instead.
 */
function taskTimestampLabels(iso: string | undefined): {
  primary: string;
  detail?: string;
} {
  if (!iso?.trim()) return { primary: '—' };
  const s = iso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = parseISO(s);
    if (!isValid(d)) return { primary: '—' };
    const label = format(d, 'PPP');
    return { primary: label };
  }
  const d = parseDbTimestamp(s);
  if (!d) return { primary: '—' };
  return {
    primary: formatDistanceToNow(d, { addSuffix: true }),
    detail: format(d, 'PPpp'),
  };
}

function commentMentionsKanban(body: string): boolean {
  return /@kanban\b/i.test(body);
}

/** Active incomplete `@kanban` mention ending at `cursor` (collapsed). */
function findIncompleteKanbanMention(
  value: string,
  cursor: number
): { atIndex: number; partial: string } | null {
  let i = cursor - 1;
  while (i >= 0 && /[a-zA-Z0-9_]/i.test(value[i] ?? '')) i--;
  if (i < 0 || value[i] !== '@') return null;

  const mentionStartsToken = i === 0 || /\s/.test(value[i - 1] ?? '');
  if (!mentionStartsToken) return null;

  const partial = value.slice(i + 1, cursor).toLowerCase();
  if (!KANBAN_MENTION_TOKEN.startsWith(partial)) return null;
  if (partial === KANBAN_MENTION_TOKEN) return null;

  return { atIndex: i, partial };
}

function kanbanMentionGhostSuffix(value: string, cursor: number): string {
  const ctx = findIncompleteKanbanMention(value, cursor);
  if (!ctx) return '';
  return KANBAN_MENTION_TOKEN.slice(ctx.partial.length);
}

/**
 * Tab completes `@` + optional prefix to `@kanban` when mention is active.
 */
function tryTabCompleteKanbanMention(
  el: HTMLTextAreaElement
): { value: string; cursor: number } | null {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  if (start !== end) return null;

  const value = el.value;
  const ctx = findIncompleteKanbanMention(value, start);
  if (!ctx) return null;

  const { atIndex: i } = ctx;
  const before = value.slice(0, i);
  const after = value.slice(start);
  const completed = `@${KANBAN_MENTION_TOKEN}`;
  const newValue = before + completed + after;
  const newCursor = before.length + completed.length;
  return { value: newValue, cursor: newCursor };
}

interface TaskModalProps {
  task: Task;
  guestMode?: boolean;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onSprintChange: (taskId: string, newSprint: number) => void;
  onDescriptionChange: (taskId: string, newDescription: string) => void;
  onTitleChange: (taskId: string, newTitle: string) => void;
  onDueDateChange: (taskId: string, newDueDate: Date) => void;
}

export default function TaskModal({
  task,
  guestMode = false,
  onClose,
  onStatusChange,
  onSprintChange,
  onDescriptionChange,
  onTitleChange,
  onDueDateChange,
}: TaskModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState(task.status); // Local state for the status
  const [sprint, setSprint] = useState(task.sprint); // Local state for the sprint
  const [dueDate, setDueDate] = useState(() => parseTaskDueDate(task.due_date));
  const [showCalendar, setShowCalendar] = useState(false);
  const [description, setDescription] = useState(task.description);
  const [title, setTitle] = useState(task.title); // Local state for the title
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [assigneeLabel, setAssigneeLabel] = useState('');
  const [assigneeInitials, setAssigneeInitials] = useState('');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const titleDebounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSelection, setCommentSelection] = useState({ start: 0, end: 0 });
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const commentMirrorRef = useRef<HTMLDivElement>(null);

  const kanbanGhostSuffix = useMemo(() => {
    if (commentSelection.start !== commentSelection.end) return '';
    return kanbanMentionGhostSuffix(commentDraft, commentSelection.start);
  }, [commentDraft, commentSelection.start, commentSelection.end]);

  const loadComments = useCallback(async () => {
    if (guestMode) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const rows = await listTaskComments(task.id);
      setComments(rows);
    } catch (e) {
      console.error(e);
      setCommentsError('Could not load comments');
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [guestMode, task.id]);

  useEffect(() => {
    if (guestMode) {
      setComments([]);
      setCommentsError(null);
      return;
    }
    void loadComments();
  }, [guestMode, loadComments]);

  useEffect(() => {
    if (guestMode) return;
    const channel = supabase
      .channel(`task_comments:${task.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${task.id}`,
        },
        () => {
          void loadComments();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [guestMode, task.id, loadComments]);

  // Update local state whenever the task prop changes
  useEffect(() => {
    setStatus(task.status);
    setSprint(task.sprint);
    setTitle(task.title);
    setDueDate(parseTaskDueDate(task.due_date));
  }, [task.status, task.sprint, task.title, task.due_date]);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const id = (task.assignee_id ?? '').trim();
    if (!id) {
      setAssigneeLabel('Unassigned');
      setAssigneeInitials('—');
      return;
    }
    if (user?.id === id) {
      setAssigneeLabel(getDisplayName(user));
      setAssigneeInitials(getUserInitials(user));
      return;
    }
    let cancelled = false;
    void (async () => {
      const fromProfile = await fetchProfileDisplayName(id);
      if (cancelled) return;
      if (fromProfile) {
        setAssigneeLabel(fromProfile);
        setAssigneeInitials(
          fromProfile
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || '?'
        );
      } else {
        setAssigneeLabel('Unknown user');
        setAssigneeInitials('?');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [task.assignee_id, user]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as Status;
    setStatus(newStatus);
    onStatusChange(task.id, newStatus);
  };

  const handleSprintChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSprint = parseInt(e.target.value, 10);
    setSprint(newSprint);
    onSprintChange(task.id, newSprint);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onDescriptionChange(task.id, newDescription);
    }, 3000); // Adjust the delay as needed
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (titleDebounceTimeout.current) {
      clearTimeout(titleDebounceTimeout.current);
    }

    titleDebounceTimeout.current = setTimeout(() => {
      onTitleChange(task.id, newTitle);
    }, 3000); // Adjust the delay as needed
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setDueDate(date);
      setShowCalendar(false);
      onDueDateChange(task.id, date);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 200); // Match CSS transition duration
  };

  const handleSubmitComment = async () => {
    if (!user || guestMode) return;
    const draft = commentDraft.trim();
    if (!draft) return;

    const authorDisplayName =
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
      user.email?.split('@')[0] ||
      null;
    const askAi = commentMentionsKanban(draft);

    setCommentSubmitting(true);
    try {
      const row = await createTaskComment({
        taskId: task.id,
        body: draft,
        authorDisplayName,
      });
      const threadAfterUser = [...comments, row];
      setComments(threadAfterUser);
      setCommentDraft('');
      setCommentSelection({ start: 0, end: 0 });

      if (askAi) {
        try {
          const reply = await generateKanbanTaskCommentReply({
            task: {
              title: task.title,
              description: task.description,
              status: task.status,
              sprint: task.sprint,
              dueDate: task.due_date,
              type: task.type,
              priority: task.priority,
              createdAt: task.created_at,
              updatedAt: task.updated_at,
            },
            thread: threadAfterUser.map((c) => ({
              author: c.author_display_name?.trim() || 'User',
              body: c.body,
            })),
            userMessage: draft,
          });
          const aiRow = await createTaskComment({
            taskId: task.id,
            body: reply,
            authorDisplayName: KANBAN_AI_COMMENT_AUTHOR,
          });
          setComments((prev) => [...prev, aiRow]);
        } catch (aiErr) {
          console.error(aiErr);
          toast.error(
            aiErr instanceof Error ? aiErr.message : 'KanbanAI could not reply'
          );
        }
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not post comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (commentSubmitting) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      if (commentDraft.trim()) void handleSubmitComment();
      return;
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      const el = e.currentTarget;
      const next = tryTabCompleteKanbanMention(el);
      if (!next) return;
      e.preventDefault();
      setCommentDraft(next.value);
      setCommentSelection({ start: next.cursor, end: next.cursor });
      requestAnimationFrame(() => {
        el.setSelectionRange(next.cursor, next.cursor);
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || guestMode) return;
    try {
      await deleteTaskComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      console.error(e);
      toast.error('Could not delete comment');
    }
  };

  const commentAuthorInitials = (c: TaskComment) => {
    const name = (c.author_display_name ?? '').trim();
    if (!name) return '?';
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const createdMeta = useMemo(() => taskTimestampLabels(task.created_at), [task.created_at]);
  const updatedMeta = useMemo(() => taskTimestampLabels(task.updated_at), [task.updated_at]);

  const fieldSelectClass =
    'w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-3 text-sm text-gray-900 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/15';

  const datepickerShellClass =
    'absolute left-0 top-full z-[60] mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800 [&_.react-datepicker]:!border-gray-700 [&_.react-datepicker]:!bg-gray-800 [&_.react-datepicker__triangle]:!hidden [&_.react-datepicker__header]:!border-gray-700 [&_.react-datepicker__header]:!bg-gray-800 [&_.react-datepicker__current-month]:!text-gray-100 [&_.react-datepicker__day-name]:!text-gray-400 [&_.react-datepicker__day]:!text-gray-200 [&_.react-datepicker__day:hover]:!bg-gray-700 [&_.react-datepicker__day--outside-month]:!text-gray-500 [&_.react-datepicker__day--selected]:!bg-indigo-600 [&_.react-datepicker__day--selected]:!text-white [&_.react-datepicker__day--keyboard-selected]:!bg-indigo-600/70 [&_.react-datepicker__navigation-icon::before]:!border-gray-300';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 transition-all duration-200 ease-out sm:p-4 ${
        isClosing
          ? 'bg-black/0'
          : isVisible
            ? 'bg-black/50 dark:bg-black/60'
            : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-200 ease-out dark:border-gray-700 dark:bg-gray-900 ${
          isClosing ? 'scale-95 opacity-0' : isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="min-w-0 flex-1 overflow-y-auto border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:border-b-0 lg:border-r">
            <div className="flex min-h-0 flex-1 flex-col gap-5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-xs capitalize text-gray-500 dark:text-gray-400">
                    {task.type} · {task.priority} priority
                  </p>
                  <input
                    id="task-modal-title"
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    className="w-full border-0 bg-transparent text-xl font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="Task title"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="task-modal-status" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Status
                  </label>
                  <select
                    id="task-modal-status"
                    value={status}
                    onChange={handleStatusChange}
                    className={fieldSelectClass}
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="task-modal-sprint" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Sprint
                  </label>
                  <select
                    id="task-modal-sprint"
                    value={sprint}
                    onChange={handleSprintChange}
                    className={fieldSelectClass}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>
                        Sprint {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex min-h-[14rem] flex-1 flex-col sm:min-h-[16rem]">
                <label htmlFor="task-modal-description" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <TextareaAutosize
                  id="task-modal-description"
                  minRows={8}
                  className="box-border w-full min-h-[12rem] flex-1 resize-y rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm leading-6 text-gray-800 placeholder:text-gray-400 focus:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-indigo-400/40"
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Details, criteria, links…"
                  spellCheck={false}
                />
              </div>

              <div className="mt-auto grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative min-w-0">
                  <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Due date</span>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700/50"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <Calendar className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
                    {dueDate.toLocaleDateString()}
                  </button>
                  {showCalendar && (
                    <div className={datepickerShellClass}>
                      <Suspense
                        fallback={<div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">Loading…</div>}
                      >
                        <TaskModalCalendar
                          selected={dueDate}
                          onChange={handleDateChange}
                          onClickOutside={() => setShowCalendar(false)}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Assignee</span>
                  <div className="flex min-h-[2.5rem] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-200"
                      aria-hidden
                    >
                      {assigneeInitials === '—' ? (
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      ) : (
                        assigneeInitials
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                      {assigneeLabel}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                <span>
                  Created {createdMeta.primary}
                  {createdMeta.detail ? (
                    <span className="ml-1 text-[10px] opacity-80">({createdMeta.detail})</span>
                  ) : null}
                </span>
                <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                <span>
                  Updated {updatedMeta.primary}
                  {updatedMeta.detail ? (
                    <span className="ml-1 text-[10px] opacity-80">({updatedMeta.detail})</span>
                  ) : null}
                </span>
              </p>
            </div>
          </div>

          <aside className="flex min-h-0 min-w-0 flex-col border-gray-200 bg-zinc-50 dark:border-gray-800 dark:bg-gray-950 max-lg:min-h-[14rem] max-lg:max-h-[50vh] lg:w-[min(100%,28rem)] lg:shrink-0 lg:border-l">
            <div className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-gray-800 lg:px-5">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Comments</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-5">
              {guestMode ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Comments sync to your team when you use a saved project.{' '}
                  <Link
                    to="/login"
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Sign in
                  </Link>{' '}
                  to use comments.
                </p>
              ) : (
                <>
                  {commentsLoading && (
                    <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Loading comments…</p>
                  )}
                  {commentsError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{commentsError}</p>
                  )}
                  {!commentsLoading && !commentsError && comments.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet.</p>
                  )}
                  <div className="space-y-4">
                    {comments.map((c) => {
                      const commentAt = parseDbTimestamp(c.created_at);
                      return (
                        <div key={c.id} className="flex gap-3">
                          <TaskCommentAuthorAvatar
                            authorDisplayName={c.author_display_name}
                            initials={commentAuthorInitials(c)}
                            surface="modal"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-sm">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {displayTaskCommentAuthorName(c.author_display_name)}
                                </span>
                                <span className="mx-1 text-gray-400 dark:text-gray-500">·</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {commentAt
                                    ? formatDistanceToNow(commentAt, { addSuffix: true })
                                    : '—'}
                                </span>
                              </div>
                              {user?.id === c.user_id && (
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteComment(c.id)}
                                  className="rounded p-0.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                                  title="Delete comment"
                                  aria-label="Delete comment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                              {c.body}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="shrink-0 border-t border-gray-200 p-4 dark:border-gray-700 lg:px-5">
              {!guestMode && user ? (
                <>
                  <div
                    className={`flex min-h-[5.5rem] flex-col rounded-lg border border-gray-200 bg-zinc-50 transition-colors focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/15 dark:border-gray-600 dark:bg-gray-800/80 dark:focus-within:border-indigo-500/40 ${
                      commentSubmitting ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex min-h-[3rem] flex-1 items-end gap-1.5 px-2.5 pb-1 pt-2">
                      <div className="relative max-h-[9rem] min-h-[2.75rem] min-w-0 flex-1">
                        <div
                          ref={commentMirrorRef}
                          className="pointer-events-none absolute inset-0 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words py-1 text-[13px] leading-snug text-zinc-900 [scrollbar-width:none] dark:text-zinc-100 [&::-webkit-scrollbar]:hidden"
                          aria-hidden
                        >
                          <span>{commentDraft.slice(0, commentSelection.start)}</span>
                          {kanbanGhostSuffix ? (
                            <span className="text-zinc-400 dark:text-zinc-500">{kanbanGhostSuffix}</span>
                          ) : null}
                          <span>{commentDraft.slice(commentSelection.start)}</span>
                        </div>
                        <textarea
                          ref={commentTextareaRef}
                          value={commentDraft}
                          onChange={(e) => {
                            const t = e.currentTarget;
                            setCommentDraft(t.value);
                            setCommentSelection({
                              start: t.selectionStart,
                              end: t.selectionEnd,
                            });
                          }}
                          onSelect={(e) => {
                            const t = e.currentTarget;
                            const start = t.selectionStart;
                            const end = t.selectionEnd;
                            setCommentSelection((prev) =>
                              prev.start === start && prev.end === end ? prev : { start, end }
                            );
                          }}
                          onScroll={(e) => {
                            if (commentMirrorRef.current) {
                              commentMirrorRef.current.scrollTop = e.currentTarget.scrollTop;
                            }
                          }}
                          onKeyDown={handleCommentKeyDown}
                          placeholder="Add a comment…"
                          disabled={commentSubmitting}
                          rows={2}
                          spellCheck={false}
                          aria-label="Task comment"
                          aria-describedby="task-comment-mention-footer"
                          className="relative z-10 max-h-[9rem] min-h-[2.75rem] w-full resize-none overflow-y-auto overflow-x-hidden bg-transparent py-1 text-[13px] leading-snug text-transparent caret-zinc-900 placeholder:text-zinc-400 focus:outline-none selection:bg-indigo-200/50 disabled:cursor-not-allowed dark:caret-zinc-100 dark:placeholder:text-zinc-500 dark:selection:bg-indigo-500/30"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSubmitComment()}
                        disabled={commentSubmitting || !commentDraft.trim()}
                        className={`mb-px flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:focus-visible:ring-indigo-400/50 ${
                          commentSubmitting || !commentDraft.trim()
                            ? 'bg-zinc-200 text-zinc-400 dark:bg-gray-700 dark:text-gray-500'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-400'
                        }`}
                        title={commentSubmitting ? 'Posting…' : 'Post comment'}
                        aria-label={commentSubmitting ? 'Posting comment' : 'Post comment'}
                      >
                        {commentSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <ArrowUp className="h-4 w-4 stroke-[2.5]" aria-hidden />
                        )}
                      </button>
                    </div>

                    <div
                      id="task-comment-mention-footer"
                      className="flex flex-wrap items-center gap-1.5 border-t border-zinc-200/90 px-2.5 py-2 dark:border-gray-600/90"
                    >
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white shadow-sm shadow-indigo-600/10 dark:bg-indigo-500"
                        title="Mention KanbanAI in this thread"
                      >
                        <Sparkles className="h-3 w-3 shrink-0 opacity-95" strokeWidth={2.25} aria-hidden />
                        @kanban
                      </span>
                      <span className="min-w-0 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
                        Type{' '}
                        <kbd className="rounded bg-white px-1 py-0.5 font-mono text-[10px] font-semibold text-zinc-800 ring-1 ring-zinc-200/90 dark:bg-gray-700 dark:text-zinc-200 dark:ring-gray-600">
                          @
                        </kbd>
                        {' — '}
                        grey text shows the rest — press{' '}
                        <kbd className="rounded bg-white px-1 py-0.5 font-mono text-[10px] font-semibold text-zinc-800 ring-1 ring-zinc-200/90 dark:bg-gray-700 dark:text-zinc-200 dark:ring-gray-600">
                          Tab
                        </kbd>{' '}
                        to accept.
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 px-1 text-center text-[10px] tabular-nums tracking-wide text-zinc-400 dark:text-zinc-500">
                    Enter to post · Shift+Enter new line
                  </p>
                </>
              ) : !guestMode ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <Link
                    to="/login"
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Sign in
                  </Link>{' '}
                  to add a comment.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
