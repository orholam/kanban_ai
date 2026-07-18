import React, { Suspense, useEffect, useState } from 'react';
import { lazyWithRetry } from '../lib/lazyWithRetry';
import { X, Calendar, User, ChevronDown } from 'lucide-react';
import type { Status, Task } from '../types';
import type { AssigneeOption } from '../lib/assignee';
import TextareaAutosize from 'react-textarea-autosize';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { getDisplayName, getUserInitials } from '../lib/userUtils';
import { TaskCommentAuthorAvatar } from './TaskCommentAuthorAvatar';
import { KANBAN_AI_COMMENT_AUTHOR } from '../lib/kanbanAiComment';

const TaskModalCalendar = lazyWithRetry(() => import('./TaskModalCalendar'));

interface CreateTaskModalProps {
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  projectId: string;
  numSprints?: number;
  defaultSprint?: number;
  defaultStatus?: Status;
  assigneeOptions?: AssigneeOption[];
}

const STATUS_OPTIONS: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

export default function CreateTaskModal({
  onClose,
  onCreateTask,
  projectId,
  numSprints = 10,
  defaultSprint = 1,
  defaultStatus = 'todo',
  assigneeOptions = [],
}: CreateTaskModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [sprint, setSprint] = useState(defaultSprint);
  const [dueDate, setDueDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [type, setType] = useState('feature');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState(user?.id || '');
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setSprint(defaultSprint);
  }, [defaultSprint]);

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const ts = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      project_id: projectId,
      title: title.trim(),
      description,
      type: type as 'bug' | 'feature' | 'scope',
      priority: priority as 'low' | 'medium' | 'high',
      status,
      sprint: parseInt(sprint.toString(), 10),
      due_date: dueDate.toISOString().split('T')[0],
      assignee_id: assigneeId,
      created_at: ts,
      updated_at: ts,
    };

    onCreateTask(newTask);
    handleClose();
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setDueDate(date);
      setShowCalendar(false);
    }
  };

  const selectedAssignee = assigneeOptions.find((o) => o.id === assigneeId);
  const fallbackLabel = user ? getDisplayName(user) : 'Unassigned';
  const fallbackInitials = user ? getUserInitials(user) : '—';
  const canEditAssignee = assigneeOptions.length > 0;
  const assigneeLabel = selectedAssignee?.name ?? (assigneeId ? fallbackLabel : 'Unassigned');
  const assigneeInitials = selectedAssignee?.initials ?? (assigneeId ? fallbackInitials : '—');

  const fieldSelectClass =
    'w-full min-h-11 rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-3 text-sm text-gray-900 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/15 sm:min-h-0 sm:py-2';

  const datepickerShellClass =
    'absolute left-0 top-full z-[60] mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800 [&_.react-datepicker]:!border-gray-700 [&_.react-datepicker]:!bg-gray-800 [&_.react-datepicker__triangle]:!hidden [&_.react-datepicker__header]:!border-gray-700 [&_.react-datepicker__header]:!bg-gray-800 [&_.react-datepicker__current-month]:!text-gray-100 [&_.react-datepicker__day-name]:!text-gray-400 [&_.react-datepicker__day]:!text-gray-200 [&_.react-datepicker__day:hover]:!bg-gray-700 [&_.react-datepicker__day--outside-month]:!text-gray-500 [&_.react-datepicker__day--selected]:!bg-indigo-600 [&_.react-datepicker__day--selected]:!text-white [&_.react-datepicker__day--keyboard-selected]:!bg-indigo-600/70 [&_.react-datepicker__navigation-icon::before]:!border-gray-300';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-stretch justify-center transition-all duration-200 ease-out sm:items-center sm:p-4 ${
        isClosing ? 'bg-black/0' : isVisible ? 'bg-black/50 dark:bg-black/60' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`flex h-dvh max-h-dvh w-full max-w-6xl flex-col overflow-hidden border-gray-200 bg-white shadow-lg transition-all duration-200 ease-out dark:border-gray-700 dark:bg-gray-900 sm:h-auto sm:max-h-[92vh] sm:rounded-xl sm:border ${
          isClosing ? 'translate-y-2 opacity-0 sm:translate-y-0 sm:scale-95' : isVisible ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-2 opacity-0 sm:translate-y-0 sm:scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-modal-title"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 lg:border-b-0 lg:border-r">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:gap-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="mb-1.5 text-xs capitalize text-gray-500 dark:text-gray-400">
                    New task
                  </p>
                  <input
                    id="create-task-modal-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border-0 bg-transparent text-xl font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="What needs doing?"
                    required
                    autoFocus
                    enterKeyHint="done"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Status</p>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Status">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = status === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setStatus(opt.id)}
                        className={`min-h-11 rounded-xl px-2 text-xs font-semibold transition-colors sm:min-h-10 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/50'
                        }`}
                        aria-pressed={active}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:min-h-[14rem]">
                <label htmlFor="create-task-description" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  Description <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <TextareaAutosize
                  id="create-task-description"
                  minRows={2}
                  className="box-border w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm leading-6 text-gray-800 placeholder:text-gray-400 focus:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-indigo-400/40 sm:min-h-[12rem] sm:resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, criteria, links…"
                  spellCheck={false}
                />
              </div>

              <div className="sm:hidden">
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  className="flex w-full min-h-11 items-center justify-between rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
                  aria-expanded={showDetails}
                >
                  More options
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className={`${showDetails ? 'grid' : 'hidden'} grid-cols-2 gap-3 sm:grid`}>
                <div>
                  <label htmlFor="create-task-sprint" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Sprint
                  </label>
                  <select
                    id="create-task-sprint"
                    value={sprint}
                    onChange={(e) => setSprint(parseInt(e.target.value, 10))}
                    className={fieldSelectClass}
                  >
                    {Array.from({ length: numSprints }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>
                        Sprint {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="create-task-type" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Type
                  </label>
                  <select
                    id="create-task-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={fieldSelectClass}
                  >
                    <option value="feature">Feature</option>
                    <option value="bug">Bug</option>
                    <option value="scope">Scope</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="create-task-priority" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    Priority
                  </label>
                  <select
                    id="create-task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={fieldSelectClass}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div
                className={`${showDetails ? 'grid' : 'hidden'} mt-auto grid shrink-0 grid-cols-1 gap-3 sm:grid sm:grid-cols-2`}
              >
                <div className="relative min-w-0">
                  <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Due date</span>
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700/50 sm:min-h-0"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <Calendar className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
                    {dueDate.toLocaleDateString()}
                  </button>
                  {showCalendar && (
                    <div className={datepickerShellClass}>
                      <Suspense
                        fallback={
                          <div className="py-4 text-center text-xs text-gray-500 dark:text-gray-400">Loading…</div>
                        }
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
                  <div className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 sm:min-h-[2.5rem]">
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
                    {canEditAssignee ? (
                      <select
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        aria-label="Assignee"
                        className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-sm text-gray-900 outline-none focus:ring-0 dark:text-gray-100"
                      >
                        <option value="">Unassigned</option>
                        {assigneeOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                        {assigneeLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-gray-700 dark:bg-gray-900 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-11 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/50 sm:min-h-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="min-h-11 flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900 sm:min-h-0 sm:flex-none"
              >
                Create task
              </button>
            </div>
          </div>

          <aside className="hidden min-h-0 min-w-0 flex-col border-gray-200 bg-zinc-50 dark:border-gray-800 dark:bg-gray-950 lg:flex lg:w-[min(100%,28rem)] lg:shrink-0 lg:border-l">
            <div className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-gray-800 lg:px-5">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">KanbanAI</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-5">
              <div className="flex gap-3">
                <TaskCommentAuthorAvatar
                  authorDisplayName={KANBAN_AI_COMMENT_AUTHOR}
                  initials="K"
                  surface="modal"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{KANBAN_AI_COMMENT_AUTHOR}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Tip</span>
                  </div>
                  <div
                    className="mt-2 rounded-xl border border-zinc-200/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-800/90 dark:text-zinc-100 dark:ring-1 dark:ring-zinc-700/80"
                    role="note"
                  >
                    <p className="leading-relaxed">
                      You can create tasks faster by using the <strong className="font-semibold text-zinc-950 dark:text-zinc-50">project assistant</strong> in the{' '}
                      <strong className="font-semibold text-zinc-950 dark:text-zinc-50">right sidebar</strong>
                      — describe what you need in natural language and I will add or update tasks for you.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
