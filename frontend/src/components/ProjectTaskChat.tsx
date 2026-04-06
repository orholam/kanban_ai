import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  PanelRightClose,
  ArrowUp,
  ChevronDown,
  Loader2,
  ListPlus,
  PencilLine,
  Trash2,
  Wrench,
  LayoutDashboard,
  Compass,
  Radar,
  Zap,
  ListTodo,
  X,
  MessageSquarePlus,
  Repeat2,
  Undo2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Task, TaskComment } from '../types';
import {
  runProjectTaskAssistant,
  getOpenAiProxyConfigured,
  PROJECT_TASK_ASSISTANT_MODEL_OPTIONS,
  type ProjectTaskChatMessage,
  type ProjectTaskAssistantProgress,
} from '../lib/openai';
import { KANBAN_TASK_DRAG_MIME, parseTaskFromDataTransfer } from '../lib/taskDnD';
import { parseDbTimestamp } from '../lib/taskDb';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { recordAnalyticsEvent } from '../lib/analyticsEvents';
import { createTaskComment, deleteTaskComment, listTaskCommentsForTasks } from '../api/taskComments';
import { KANBAN_AI_COMMENT_AUTHOR } from '../lib/kanbanAiComment';

function sliceText(s: string | undefined, max: number): string {
  if (!s) return '';
  return s.length <= max ? s : `${s.slice(0, max)}\n…[truncated]`;
}

/** Cap comments per task so the assistant context stays bounded. */
const MAX_COMMENTS_PER_TASK_FOR_CONTEXT = 80;

function taskCommentsForAssistantContext(rows: TaskComment[]) {
  const sorted = [...rows].sort((a, b) => {
    const ta = parseDbTimestamp(a.created_at)?.getTime() ?? 0;
    const tb = parseDbTimestamp(b.created_at)?.getTime() ?? 0;
    return ta - tb;
  });
  const slice =
    sorted.length > MAX_COMMENTS_PER_TASK_FOR_CONTEXT
      ? sorted.slice(-MAX_COMMENTS_PER_TASK_FOR_CONTEXT)
      : sorted;
  return slice.map((c) => ({
    author: c.author_display_name?.trim() || 'User',
    body: sliceText(c.body, 4000),
    created_at: c.created_at,
  }));
}

function buildProjectTasksContext(
  project: Project,
  tasks: Task[],
  commentsByTaskId: Record<string, TaskComment[]>
): string {
  return JSON.stringify(
    {
      project: {
        title: project.title,
        description: project.description,
        projectType: project.projectType,
        num_sprints: project.num_sprints,
        current_sprint: project.current_sprint,
        due_date: project.due_date,
        keywords: project.keywords,
        notes: sliceText(project.notes, 12_000),
        master_plan: sliceText(project.master_plan, 12_000),
        initial_prompt: sliceText(project.initial_prompt, 4_000),
        achievements: sliceText(project.achievements, 2_000),
      },
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: t.type,
        priority: t.priority,
        status: t.status,
        sprint: t.sprint,
        due_date: t.due_date,
        created_at: t.created_at,
        updated_at: t.updated_at,
        comments: taskCommentsForAssistantContext(commentsByTaskId[t.id] ?? []),
      })),
    },
    null,
    2
  );
}

function augmentProjectContextJson(
  project: Project,
  tasks: Task[],
  attached: Task[],
  commentsByTaskId: Record<string, TaskComment[]>
): string {
  const base = JSON.parse(
    buildProjectTasksContext(project, tasks, commentsByTaskId)
  ) as Record<string, unknown>;
  if (attached.length > 0) {
    base.user_attached_tasks = attached.map((t) => ({
      id: t.id,
      title: t.title,
      description: sliceText(t.description, 8000),
      type: t.type,
      priority: t.priority,
      status: t.status,
      sprint: t.sprint,
      due_date: t.due_date,
      created_at: t.created_at,
      updated_at: t.updated_at,
      comments: taskCommentsForAssistantContext(commentsByTaskId[t.id] ?? []),
    }));
  }
  return JSON.stringify(base, null, 2);
}

function dataTransferMayBeTask(dt: DataTransfer): boolean {
  return dt.types.includes(KANBAN_TASK_DRAG_MIME) || dt.types.includes('text/plain');
}

function TaskContextAttachment({
  task,
  isDarkMode,
  onRemove,
}: {
  task: Task;
  isDarkMode: boolean;
  onRemove?: () => void;
}) {
  const iconWrap = {
    bug: isDarkMode
      ? 'bg-gradient-to-br from-rose-500/30 to-rose-600/10 text-rose-200 ring-1 ring-rose-400/30'
      : 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-700 ring-1 ring-rose-200/80',
    feature: isDarkMode
      ? 'bg-gradient-to-br from-sky-500/25 to-sky-600/10 text-sky-200 ring-1 ring-sky-400/25'
      : 'bg-gradient-to-br from-sky-100 to-sky-50 text-sky-700 ring-1 ring-sky-200/80',
    scope: isDarkMode
      ? 'bg-gradient-to-br from-violet-500/25 to-violet-600/10 text-violet-200 ring-1 ring-violet-400/25'
      : 'bg-gradient-to-br from-violet-100 to-violet-50 text-violet-700 ring-1 ring-violet-200/80',
  }[task.type];

  const metaChip = isDarkMode
    ? 'bg-zinc-950/60 text-zinc-300 ring-1 ring-zinc-600/70'
    : 'bg-white/90 text-zinc-600 ring-1 ring-zinc-200/90';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.85 }}
      className={`flex min-w-0 max-w-full items-stretch gap-2.5 rounded-xl border px-2.5 py-2 ${
        isDarkMode
          ? 'border-zinc-700/80 bg-gradient-to-br from-zinc-800/95 via-zinc-900/90 to-zinc-950/90 shadow-md shadow-black/25'
          : 'border-zinc-200/90 bg-gradient-to-br from-white via-zinc-50/95 to-indigo-50/40 shadow-md shadow-indigo-950/[0.04]'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}
        aria-hidden
      >
        <ListTodo className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p
          className={`truncate text-[12px] font-semibold leading-tight tracking-tight ${
            isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
          }`}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${metaChip}`}
          >
            {task.status.replace('-', ' ')}
          </span>
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${metaChip}`}
          >
            {task.type}
          </span>
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${metaChip}`}
          >
            {task.priority}
          </span>
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${metaChip}`}
          >
            Sprint {task.sprint}
          </span>
        </div>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg transition-colors ${
            isDarkMode
              ? 'text-zinc-500 hover:bg-zinc-700/80 hover:text-zinc-200'
              : 'text-zinc-400 hover:bg-zinc-200/80 hover:text-zinc-800'
          }`}
          title="Remove from context"
          aria-label="Remove task from assistant context"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>
      ) : null}
    </motion.div>
  );
}

const STORAGE_OPEN = 'kanban-project-chat-open';

/** Minimum time to show the “running tool” card so it is readable (ms). */
const MIN_TOOL_UI_MS = 1000;

const activitySpring = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.85 };
const activityEase = [0.22, 1, 0.36, 1] as const;

const suggestionEnter = { duration: 0.38, ease: activityEase };

type SuggestionIconKey = 'board' | 'next' | 'stuck' | 'task';

const SUGGESTION_ICON: Record<SuggestionIconKey, ComponentType<{ className?: string }>> = {
  board: LayoutDashboard,
  next: Compass,
  stuck: Radar,
  task: Zap,
};

/** Shown before the first message; clicking sends the full prompt. */
const ASSISTANT_SUGGESTIONS: ReadonlyArray<{
  label: string;
  hint: string;
  prompt: string;
  icon: SuggestionIconKey;
  accent: 'violet' | 'indigo' | 'amber' | 'emerald';
}> = [
  {
    label: 'Summarize the board',
    hint: 'Status, priorities & sprints at a glance',
    icon: 'board',
    accent: 'indigo',
    prompt:
      'Give a short summary of my tasks: counts by status, anything high priority or with due dates soon, and what sprint they’re in.',
  },
  {
    label: 'What should I do next?',
    hint: 'Prioritized next steps from your tasks',
    icon: 'next',
    accent: 'violet',
    prompt: 'Based on this board, what are the best next 2–3 things I should work on and why?',
  },
  {
    label: 'Find stuck work',
    hint: 'Spot blockers and vague items',
    icon: 'stuck',
    accent: 'amber',
    prompt:
      'Which tasks look blocked, vague, or have been in progress too long? List them and suggest one concrete next step for each.',
  },
  {
    label: 'Add a follow-up task',
    hint: 'Draft and add a helpful task',
    icon: 'task',
    accent: 'emerald',
    prompt:
      'Propose one small follow-up task that would unblock progress. If it makes sense, create it in todo for the current sprint with a clear title and one-sentence description.',
  },
];

const accentIconWrap: Record<
  (typeof ASSISTANT_SUGGESTIONS)[number]['accent'],
  { light: string; dark: string }
> = {
  indigo: {
    light: 'bg-indigo-100 text-indigo-700 ring-indigo-200/80',
    dark: 'bg-indigo-500/20 text-indigo-200 ring-indigo-400/25',
  },
  violet: {
    light: 'bg-violet-100 text-violet-700 ring-violet-200/80',
    dark: 'bg-violet-500/20 text-violet-200 ring-violet-400/25',
  },
  amber: {
    light: 'bg-amber-100 text-amber-800 ring-amber-200/80',
    dark: 'bg-amber-500/15 text-amber-200 ring-amber-400/20',
  },
  emerald: {
    light: 'bg-emerald-100 text-emerald-800 ring-emerald-200/80',
    dark: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/20',
  },
};

function activityPhaseKey(p: ProjectTaskAssistantProgress): string {
  return p.phase === 'awaiting_model' ? 'phase-model' : `phase-tool-${p.toolName}`;
}

const TASK_TYPES = new Set<Task['type']>(['bug', 'feature', 'scope']);
const PRIORITIES = new Set<Task['priority']>(['low', 'medium', 'high']);
const STATUSES = new Set<Task['status']>(['todo', 'in-progress', 'done']);

function clampSprint(value: unknown, maxSprints: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  const cap = Math.max(1, maxSprints);
  if (Number.isNaN(n)) return 1;
  return Math.min(Math.max(1, n), cap);
}

function todayYmd(): string {
  return new Date().toISOString().split('T')[0];
}

function nowIso(): string {
  return new Date().toISOString();
}

type AgentTaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'type' | 'priority' | 'status' | 'sprint' | 'due_date'>
>;

type AgentUndoEntry =
  | { kind: 'create'; taskId: string }
  | { kind: 'update'; taskId: string; patch: AgentTaskPatch }
  | { kind: 'delete'; task: Task }
  | { kind: 'comment'; commentId: string; taskId: string };

function taskRowForPersistence(t: Task): Task {
  return {
    id: t.id,
    project_id: t.project_id,
    title: t.title,
    description: t.description,
    type: t.type,
    priority: t.priority,
    status: t.status,
    sprint: t.sprint,
    due_date: t.due_date,
    assignee_id: t.assignee_id,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

function toolProgressLabel(toolName: string): string {
  switch (toolName) {
    case 'create_task':
      return 'Saving a new task to your board…';
    case 'update_task':
      return 'Applying changes to a task…';
    case 'delete_task':
      return 'Removing a task from your board…';
    case 'add_task_comment':
      return 'Posting a comment on the task…';
    case 'undo_last_action':
      return 'Reverting your last board change…';
    default:
      return `Running “${toolName}”…`;
  }
}

function toolProgressHeadline(toolName: string): string {
  switch (toolName) {
    case 'create_task':
      return 'Adding a task';
    case 'update_task':
      return 'Editing a task';
    case 'delete_task':
      return 'Deleting a task';
    case 'add_task_comment':
      return 'Adding a comment';
    case 'undo_last_action':
      return 'Undoing last action';
    default:
      return 'Board action';
  }
}

interface ProjectTaskChatProps {
  isDarkMode: boolean;
  project: Project | null;
  tasks: Task[];
  boardLoading: boolean;
  /** Local guest boards skip loading comments from Supabase. */
  guestMode?: boolean;
  onCreateTask: (task: Task) => Promise<void>;
  onUpdateTask: (
    taskId: string,
    patch: Partial<Pick<Task, 'title' | 'description' | 'type' | 'priority' | 'status' | 'sprint' | 'due_date'>>
  ) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

async function fetchCommentsByTaskIdForAssistant(
  taskIds: string[],
  opts: { skip: boolean }
): Promise<Record<string, TaskComment[]>> {
  if (opts.skip || taskIds.length === 0) return {};
  try {
    const rows = await listTaskCommentsForTasks(taskIds);
    const map: Record<string, TaskComment[]> = {};
    for (const c of rows) {
      if (!map[c.task_id]) map[c.task_id] = [];
      map[c.task_id].push(c);
    }
    return map;
  } catch (e) {
    console.error('Task comments for assistant context:', e);
    return {};
  }
}

export default function ProjectTaskChat({
  isDarkMode,
  project,
  tasks,
  boardLoading,
  guestMode = false,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: ProjectTaskChatProps) {
  const { user, accountProfile } = useAuth();
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  /** Fresh snapshot for each assistant request (includes comments added in the task modal). */
  const commentsForContextRef = useRef<Record<string, TaskComment[]>>({});

  /** One-step stack of successful assistant mutations (for undo_last_action). */
  const agentUndoStackRef = useRef<AgentUndoEntry[]>([]);

  const [open, setOpen] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_OPEN);
      if (v === null) return true;
      return JSON.parse(v) as boolean;
    } catch {
      return true;
    }
  });
  const [messages, setMessages] = useState<ProjectTaskChatMessage[]>([]);
  const messagesRef = useRef<ProjectTaskChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const [input, setInput] = useState('');
  const [composerAttachments, setComposerAttachments] = useState<Task[]>([]);
  const [dragOverPanel, setDragOverPanel] = useState(false);
  const [sending, setSending] = useState(false);
  const [liveProgress, setLiveProgress] = useState<ProjectTaskAssistantProgress | null>(null);
  const [openAiReady, setOpenAiReady] = useState<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void getOpenAiProxyConfigured().then((ok) => {
      if (!cancelled) setOpenAiReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const lastRunningToolAtRef = useRef<number | null>(null);
  const progressDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAssistantReplyRef = useRef<string | null>(null);

  const handleActivityExitComplete = useCallback(() => {
    const pending = pendingAssistantReplyRef.current;
    pendingAssistantReplyRef.current = null;
    if (pending != null) {
      setMessages((m) => [...m, { role: 'assistant', content: pending }]);
    }
    setSending(false);
  }, []);

  const clearProgressDelayTimer = useCallback(() => {
    if (progressDelayTimerRef.current != null) {
      clearTimeout(progressDelayTimerRef.current);
      progressDelayTimerRef.current = null;
    }
  }, []);

  const applyProgressEvent = useCallback(
    (event: ProjectTaskAssistantProgress) => {
      clearProgressDelayTimer();
      if (event.phase === 'running_tool') {
        lastRunningToolAtRef.current = Date.now();
        setLiveProgress(event);
        return;
      }
      if (event.phase === 'awaiting_model') {
        const started = lastRunningToolAtRef.current;
        if (started != null) {
          const elapsed = Date.now() - started;
          const wait = Math.max(0, MIN_TOOL_UI_MS - elapsed);
          if (wait > 0) {
            progressDelayTimerRef.current = setTimeout(() => {
              progressDelayTimerRef.current = null;
              lastRunningToolAtRef.current = null;
              setLiveProgress(event);
            }, wait);
            return;
          }
          lastRunningToolAtRef.current = null;
        }
        setLiveProgress(event);
      }
    },
    [clearProgressDelayTimer]
  );

  const lingerAfterToolIfNeeded = useCallback(async () => {
    clearProgressDelayTimer();
    const started = lastRunningToolAtRef.current;
    if (started == null) return;
    const wait = Math.max(0, MIN_TOOL_UI_MS - (Date.now() - started));
    lastRunningToolAtRef.current = null;
    if (wait > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, wait));
    }
  }, [clearProgressDelayTimer]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OPEN, JSON.stringify(open));
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    setMessages([]);
    setInput('');
    setComposerAttachments([]);
    clearProgressDelayTimer();
    lastRunningToolAtRef.current = null;
    agentUndoStackRef.current = [];
  }, [project?.id, clearProgressDelayTimer]);

  const handleDragEnterPanel = useCallback((e: React.DragEvent) => {
    if (!dataTransferMayBeTask(e.dataTransfer)) return;
    e.preventDefault();
    setDragOverPanel(true);
  }, []);

  const handleDragLeavePanel = useCallback((e: React.DragEvent) => {
    if (!dataTransferMayBeTask(e.dataTransfer)) return;
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDragOverPanel(false);
  }, []);

  const handleDragOverPanel = useCallback((e: React.DragEvent) => {
    if (!dataTransferMayBeTask(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverPanel(true);
  }, []);

  const handleBoardDrop = useCallback(
    (e: React.DragEvent) => {
      if (!dataTransferMayBeTask(e.dataTransfer)) return;
      e.preventDefault();
      setDragOverPanel(false);
      const p = project;
      if (!p) return;
      const task = parseTaskFromDataTransfer(e.dataTransfer, tasksRef.current);
      if (!task) return;
      if (task.project_id !== p.id) {
        toast.error('Only tasks from this board can be attached.');
        return;
      }
      setOpen(true);
      setComposerAttachments((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        if (prev.length >= 12) {
          toast.message('You can attach up to 12 tasks at once');
          return prev;
        }
        return [...prev, task];
      });
    },
    [project]
  );

  useEffect(() => {
    return () => clearProgressDelayTimer();
  }, [clearProgressDelayTimer]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, liveProgress, sending]);

  const executeTool = useCallback(
    async (name: string, args: Record<string, unknown>): Promise<string> => {
      const p = project;
      if (!p) return JSON.stringify({ error: 'No project loaded' });

      if (name === 'create_task') {
        const title = typeof args.title === 'string' ? args.title.trim() : '';
        if (!title) return JSON.stringify({ error: 'title is required' });

        const typeRaw = typeof args.type === 'string' ? args.type : 'feature';
        const type = TASK_TYPES.has(typeRaw as Task['type']) ? (typeRaw as Task['type']) : 'feature';

        const priRaw = typeof args.priority === 'string' ? args.priority : 'medium';
        const priority = PRIORITIES.has(priRaw as Task['priority'])
          ? (priRaw as Task['priority'])
          : 'medium';

        const stRaw = typeof args.status === 'string' ? args.status : 'todo';
        const status = STATUSES.has(stRaw as Task['status']) ? (stRaw as Task['status']) : 'todo';

        const sprint = clampSprint(args.sprint, p.num_sprints || 10);
        const desc = typeof args.description === 'string' ? args.description : '';
        let due = typeof args.due_date === 'string' ? args.due_date.trim() : todayYmd();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) due = todayYmd();

        const ts = nowIso();
        const newTask: Task = {
          id: uuidv4(),
          project_id: p.id,
          title,
          description: desc,
          type,
          priority,
          status,
          sprint,
          due_date: due,
          assignee_id: user?.id ?? '',
          created_at: ts,
          updated_at: ts,
        };

        try {
          await onCreateTask(newTask);
          tasksRef.current = [...tasksRef.current, newTask];
          agentUndoStackRef.current.push({ kind: 'create', taskId: newTask.id });
          return JSON.stringify({
            success: true,
            task_id: newTask.id,
            title: newTask.title,
            status: newTask.status,
            sprint: newTask.sprint,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'create failed';
          return JSON.stringify({ error: message });
        }
      }

      if (name === 'update_task') {
        const taskId = typeof args.task_id === 'string' ? args.task_id.trim() : '';
        if (!taskId) return JSON.stringify({ error: 'task_id is required' });

        const existing = tasksRef.current.find((t) => t.id === taskId);
        if (!existing) {
          return JSON.stringify({ error: `No task with id ${taskId}. Use ids from the tasks list in context.` });
        }

        const patch: Partial<
          Pick<Task, 'title' | 'description' | 'type' | 'priority' | 'status' | 'sprint' | 'due_date'>
        > = {};

        if (typeof args.title === 'string' && args.title.trim()) patch.title = args.title.trim();
        if (typeof args.description === 'string') patch.description = args.description;

        if (typeof args.type === 'string' && TASK_TYPES.has(args.type as Task['type'])) {
          patch.type = args.type as Task['type'];
        }
        if (typeof args.priority === 'string' && PRIORITIES.has(args.priority as Task['priority'])) {
          patch.priority = args.priority as Task['priority'];
        }
        if (typeof args.status === 'string' && STATUSES.has(args.status as Task['status'])) {
          patch.status = args.status as Task['status'];
        }
        if (args.sprint !== undefined && args.sprint !== null) {
          patch.sprint = clampSprint(args.sprint, p.num_sprints || 10);
        }
        if (typeof args.due_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(args.due_date)) {
          patch.due_date = args.due_date;
        }

        if (Object.keys(patch).length === 0) {
          return JSON.stringify({ error: 'No valid fields to update; provide at least one of title, description, type, priority, status, sprint, due_date' });
        }

        const undoPatch: AgentTaskPatch = Object.fromEntries(
          (Object.keys(patch) as (keyof AgentTaskPatch)[]).map((k) => [k, existing[k]])
        ) as AgentTaskPatch;

        try {
          await onUpdateTask(taskId, patch);
          const touchedAt = nowIso();
          tasksRef.current = tasksRef.current.map((t) =>
            t.id === taskId ? { ...t, ...patch, updated_at: touchedAt } : t
          );
          agentUndoStackRef.current.push({ kind: 'update', taskId, patch: undoPatch });
          return JSON.stringify({ success: true, task_id: taskId, updated: patch });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'update failed';
          return JSON.stringify({ error: message });
        }
      }

      if (name === 'delete_task') {
        const taskId = typeof args.task_id === 'string' ? args.task_id.trim() : '';
        if (!taskId) return JSON.stringify({ error: 'task_id is required' });

        const existing = tasksRef.current.find((t) => t.id === taskId);
        if (!existing) {
          return JSON.stringify({ error: `No task with id ${taskId}. Use ids from the tasks list in context.` });
        }

        const snapshot = taskRowForPersistence(existing);

        try {
          await onDeleteTask(taskId);
          tasksRef.current = tasksRef.current.filter((t) => t.id !== taskId);
          const { [taskId]: _removed, ...restComments } = commentsForContextRef.current;
          commentsForContextRef.current = restComments;
          agentUndoStackRef.current.push({ kind: 'delete', task: snapshot });
          return JSON.stringify({
            success: true,
            task_id: taskId,
            title_removed: existing.title,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'delete failed';
          return JSON.stringify({ error: message });
        }
      }

      if (name === 'add_task_comment') {
        if (guestMode) {
          return JSON.stringify({ error: 'Comments require a saved project; sign in and open a synced board.' });
        }
        if (!user) {
          return JSON.stringify({ error: 'You must be signed in to add comments.' });
        }

        const taskId = typeof args.task_id === 'string' ? args.task_id.trim() : '';
        if (!taskId) return JSON.stringify({ error: 'task_id is required' });

        const body = typeof args.body === 'string' ? args.body : '';
        if (!body.trim()) return JSON.stringify({ error: 'body is required' });

        const existing = tasksRef.current.find((t) => t.id === taskId);
        if (!existing) {
          return JSON.stringify({ error: `No task with id ${taskId}. Use ids from the tasks list in context.` });
        }

        try {
          const row = await createTaskComment({
            taskId,
            body,
            authorDisplayName: KANBAN_AI_COMMENT_AUTHOR,
          });
          const prev = commentsForContextRef.current[taskId] ?? [];
          commentsForContextRef.current = {
            ...commentsForContextRef.current,
            [taskId]: [...prev, row],
          };
          agentUndoStackRef.current.push({ kind: 'comment', commentId: row.id, taskId });
          return JSON.stringify({
            success: true,
            comment_id: row.id,
            task_id: taskId,
            task_title: existing.title,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'comment failed';
          return JSON.stringify({ error: message });
        }
      }

      if (name === 'undo_last_action') {
        const stack = agentUndoStackRef.current;
        if (stack.length === 0) {
          return JSON.stringify({ error: 'Nothing for me to undo yet.' });
        }
        const entry = stack.pop()!;
        const restoreEntry = () => {
          stack.push(entry);
        };
        try {
          switch (entry.kind) {
            case 'create': {
              await onDeleteTask(entry.taskId);
              tasksRef.current = tasksRef.current.filter((t) => t.id !== entry.taskId);
              const { [entry.taskId]: _removed, ...restComments } = commentsForContextRef.current;
              commentsForContextRef.current = restComments;
              return JSON.stringify({
                success: true,
                undone: 'create_task',
                task_id: entry.taskId,
              });
            }
            case 'update': {
              await onUpdateTask(entry.taskId, entry.patch);
              tasksRef.current = tasksRef.current.map((t) =>
                t.id === entry.taskId ? { ...t, ...entry.patch } : t
              );
              return JSON.stringify({
                success: true,
                undone: 'update_task',
                task_id: entry.taskId,
                restored: entry.patch,
              });
            }
            case 'delete': {
              const row = taskRowForPersistence(entry.task);
              await onCreateTask(row);
              tasksRef.current = [...tasksRef.current, { ...row, isAnimated: true, aiBrandish: true }];
              commentsForContextRef.current = {
                ...commentsForContextRef.current,
                [row.id]: commentsForContextRef.current[row.id] ?? [],
              };
              return JSON.stringify({
                success: true,
                undone: 'delete_task',
                task_id: row.id,
                title: row.title,
              });
            }
            case 'comment': {
              await deleteTaskComment(entry.commentId);
              const prev = commentsForContextRef.current[entry.taskId] ?? [];
              commentsForContextRef.current = {
                ...commentsForContextRef.current,
                [entry.taskId]: prev.filter((c) => c.id !== entry.commentId),
              };
              return JSON.stringify({
                success: true,
                undone: 'add_task_comment',
                comment_id: entry.commentId,
                task_id: entry.taskId,
              });
            }
            default: {
              restoreEntry();
              return JSON.stringify({ error: 'Unknown undo entry.' });
            }
          }
        } catch (err) {
          restoreEntry();
          const message = err instanceof Error ? err.message : 'undo failed';
          return JSON.stringify({ error: message });
        }
      }

      return JSON.stringify({ error: `Unknown tool: ${name}` });
    },
    [project, guestMode, onCreateTask, onUpdateTask, onDeleteTask, user]
  );

  const submitUserMessage = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      const attachSnap = [...composerAttachments];
      if ((!trimmed && attachSnap.length === 0) || !project || boardLoading || sending) return;

      const prior = messagesRef.current;
      const userMsg: ProjectTaskChatMessage = {
        role: 'user',
        content: trimmed,
        attachedTasks: attachSnap.length > 0 ? attachSnap : undefined,
      };
      setMessages((m) => [...m, userMsg]);
      setInput('');
      setComposerAttachments([]);
      setSending(true);
      pendingAssistantReplyRef.current = null;
      lastRunningToolAtRef.current = null;
      clearProgressDelayTimer();
      setLiveProgress({ phase: 'awaiting_model' });

      const taskIds = tasksRef.current.map((t) => t.id);
      commentsForContextRef.current = await fetchCommentsByTaskIdForAssistant(taskIds, {
        skip: guestMode,
      });

      const getContextJsonForRequest = () =>
        augmentProjectContextJson(
          project,
          tasksRef.current,
          attachSnap,
          commentsForContextRef.current
        );

      try {
        const reply = await runProjectTaskAssistant(
          getContextJsonForRequest,
          prior,
          trimmed,
          executeTool,
          applyProgressEvent,
          attachSnap.length > 0 ? attachSnap : undefined
        );
        await lingerAfterToolIfNeeded();
        pendingAssistantReplyRef.current = reply;
        if (guestMode) {
          recordAnalyticsEvent(
            'ai_interaction',
            {
              project_id: project.id,
              attachment_count: attachSnap.length,
              user_message_length: trimmed.length,
            },
            { kind: 'guest' }
          );
        } else if (user) {
          recordAnalyticsEvent(
            'ai_interaction',
            {
              project_id: project.id,
              attachment_count: attachSnap.length,
              user_message_length: trimmed.length,
            },
            { kind: 'user', userId: user.id, accountRole: accountProfile?.account_role }
          );
        }
      } catch (e) {
        pendingAssistantReplyRef.current = null;
        const msg = e instanceof Error ? e.message : 'Something went wrong';
        toast.error(msg);
        setMessages((m) => m.slice(0, -1));
        setInput(trimmed);
        setComposerAttachments(attachSnap);
        await lingerAfterToolIfNeeded();
      } finally {
        setLiveProgress(null);
      }
    },
    [
      project,
      boardLoading,
      sending,
      guestMode,
      user,
      accountProfile?.account_role,
      composerAttachments,
      executeTool,
      applyProgressEvent,
      lingerAfterToolIfNeeded,
      clearProgressDelayTimer,
    ]
  );

  const send = useCallback(() => {
    void submitUserMessage(input);
  }, [input, submitUserMessage]);

  const canSend =
    (input.trim().length > 0 || composerAttachments.length > 0) &&
    !boardLoading &&
    !sending &&
    openAiReady === true;

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) void submitUserMessage(input);
    }
  };

  const startNewChat = useCallback(() => {
    if (sending || messages.length === 0) return;
    setMessages([]);
    setInput('');
    setComposerAttachments([]);
    setLiveProgress(null);
    pendingAssistantReplyRef.current = null;
    lastRunningToolAtRef.current = null;
    clearProgressDelayTimer();
  }, [sending, messages.length, clearProgressDelayTimer]);

  if (!project) {
    return null;
  }

  const border = isDarkMode ? 'border-zinc-800/60' : 'border-zinc-200/70';
  const panelBg = isDarkMode
    ? 'bg-zinc-950/80 backdrop-blur-xl'
    : 'bg-zinc-50/80 backdrop-blur-xl';
  const headerBg = isDarkMode ? 'bg-zinc-950/40' : 'bg-white/50';

  if (!open) {
    return (
      <div
        className={`relative flex w-12 shrink-0 flex-col border-l ${border} ${panelBg}`}
        aria-label="Project assistant collapsed"
        onDragEnter={handleDragEnterPanel}
        onDragLeave={handleDragLeavePanel}
        onDragOver={handleDragOverPanel}
        onDrop={handleBoardDrop}
      >
        {dragOverPanel ? (
          <div
            className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-indigo-400/70 ${
              isDarkMode ? 'bg-indigo-500/15' : 'bg-indigo-50/70'
            }`}
            aria-hidden
          >
            <span
              className={`max-w-[7rem] text-center text-[10px] font-semibold uppercase leading-tight tracking-wide ${
                isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
              }`}
            >
              Drop to attach
            </span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`flex flex-1 flex-col items-center justify-center gap-2 px-1 py-4 transition-colors ${
            isDarkMode
              ? 'text-indigo-400 hover:bg-zinc-900'
              : 'text-indigo-600 hover:bg-indigo-50/90'
          }`}
          title="Open project assistant"
        >
          <Sparkles className="h-5 w-5 shrink-0" />
          <span
            className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-zinc-500"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            AI
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`relative flex h-full max-h-full min-h-0 w-[min(100%,400px)] shrink-0 flex-col border-l ${border} ${panelBg}`}
      aria-label="Project task assistant"
      onDragEnter={handleDragEnterPanel}
      onDragLeave={handleDragLeavePanel}
      onDragOver={handleDragOverPanel}
      onDrop={handleBoardDrop}
    >
      {dragOverPanel ? (
        <div
          className={`pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-indigo-400/75 px-4 ${
            isDarkMode ? 'bg-indigo-500/[0.12] backdrop-blur-[2px]' : 'bg-indigo-50/85 backdrop-blur-[2px]'
          }`}
          aria-hidden
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isDarkMode
                ? 'bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/35'
                : 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/90'
            }`}
          >
            <ListTodo className="h-6 w-6" strokeWidth={2} />
          </div>
          <p
            className={`text-center text-sm font-semibold ${isDarkMode ? 'text-indigo-100' : 'text-indigo-900'}`}
          >
            Drop tasks here
          </p>
          <p className={`max-w-[220px] text-center text-xs ${isDarkMode ? 'text-indigo-200/80' : 'text-indigo-800/80'}`}>
            Release to add them as context for your next message.
          </p>
        </div>
      ) : null}
      <div
        className={`flex items-center justify-between gap-2 border-b px-4 py-3 ${headerBg} ${
          isDarkMode ? 'border-zinc-800/50' : 'border-zinc-200/60'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isDarkMode
                ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/25'
                : 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/80'
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className={`truncate text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
              Project assistant
            </p>
            <p className={`truncate text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {tasks.length} task{tasks.length === 1 ? '' : 's'} on board
              {composerAttachments.length > 0
                ? ` · ${composerAttachments.length} attached`
                : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={startNewChat}
            disabled={messages.length === 0 || sending}
            className={`rounded-lg p-2 transition-colors disabled:pointer-events-none disabled:opacity-30 ${
              isDarkMode
                ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
                : 'text-zinc-500 hover:bg-zinc-100/90 hover:text-zinc-900'
            }`}
            title="New chat"
            aria-label="New chat"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`rounded-lg p-2 transition-colors ${
              isDarkMode
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
            title="Collapse panel"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-4 ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'} ${
          messages.length === 0 ? '' : 'space-y-3 py-4'
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col justify-center py-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { ...suggestionEnter, duration: 0.4 } }}
              className={`mx-auto w-full max-w-sm rounded-3xl ${
                isDarkMode
                  ? 'bg-zinc-900/25 ring-1 ring-zinc-700/30'
                  : 'bg-white/45 ring-1 ring-zinc-200/40 shadow-[0_1px_3px_rgba(15,23,42,0.04)]'
              }`}
            >
              <div className="px-5 pb-7 pt-8">
                <p
                  className={`text-center text-sm font-normal leading-relaxed tracking-wide ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}
                >
                  Pick a starter, or write your own below.
                </p>

                <ul className="mt-10 flex flex-col gap-5">
                  {ASSISTANT_SUGGESTIONS.map((s, i) => {
                    const Icon = SUGGESTION_ICON[s.icon];
                    const iconWrap = accentIconWrap[s.accent][isDarkMode ? 'dark' : 'light'];
                    const disabled = boardLoading || sending || openAiReady !== true;
                    return (
                      <motion.li
                        key={s.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { ...suggestionEnter, delay: 0.06 * i + 0.04 },
                        }}
                      >
                        <motion.button
                          type="button"
                          disabled={disabled}
                          whileHover={disabled ? undefined : { scale: 1.01 }}
                          whileTap={disabled ? undefined : { scale: 0.99 }}
                          onClick={() => void submitUserMessage(s.prompt)}
                          className={`group flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                            isDarkMode
                              ? 'border-zinc-700/50 bg-zinc-950/25 hover:border-zinc-600/60 hover:bg-zinc-900/40'
                              : 'border-zinc-200/80 bg-white/80 hover:border-zinc-300 hover:bg-white'
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${iconWrap}`}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0 pt-0.5">
                            <span
                              className={`block text-sm font-medium leading-snug ${
                                isDarkMode ? 'text-zinc-100' : 'text-zinc-800'
                              }`}
                            >
                              {s.label}
                            </span>
                            <span
                              className={`mt-1.5 block text-xs leading-relaxed ${
                                isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
                              }`}
                            >
                              {s.hint}
                            </span>
                          </span>
                        </motion.button>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          </div>
        ) : null}
        {messages.map((m, i) => {
          const isLatest = i === messages.length - 1;
          return (
            <motion.div
              key={i}
              layout="position"
              initial={isLatest ? { opacity: 0, y: 14, scale: 0.98 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={activitySpring}
              className={`rounded-xl px-3.5 py-2.5 text-sm ${
                m.role === 'user'
                  ? isDarkMode
                    ? 'ml-3 bg-indigo-500/15 text-indigo-100 ring-1 ring-indigo-400/20'
                    : 'ml-3 bg-indigo-50 text-indigo-950 ring-1 ring-indigo-200/80'
                  : isDarkMode
                    ? 'mr-1 bg-zinc-800/90 text-zinc-100 ring-1 ring-zinc-700/80'
                    : 'mr-1 border border-zinc-200/90 bg-white text-zinc-900 shadow-sm'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="space-y-2">
                  {m.attachedTasks && m.attachedTasks.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {m.attachedTasks.map((t) => (
                        <TaskContextAttachment key={t.id} task={t} isDarkMode={isDarkMode} />
                      ))}
                    </div>
                  ) : null}
                  {m.content.trim() ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : m.attachedTasks?.length ? (
                    <p
                      className={`text-xs italic ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-900/60'}`}
                    >
                      (Attached tasks only)
                    </p>
                  ) : null}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div
        className={`shrink-0 overflow-hidden px-4 ${isDarkMode ? 'border-zinc-800/40' : 'border-zinc-200/60'} border-t border-opacity-100`}
      >
        <AnimatePresence onExitComplete={handleActivityExitComplete}>
          {sending && liveProgress ? (
            <motion.div
              key="assistant-activity"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: activityEase }}
              className="overflow-hidden pt-2.5 pb-1"
            >
              <div
                className={`rounded-xl border px-3 py-2.5 shadow-sm ${
                  isDarkMode
                    ? 'border-zinc-700/90 bg-zinc-900/80 text-zinc-200'
                    : 'border-zinc-200/90 bg-white text-zinc-800'
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activityPhaseKey(liveProgress)}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2, ease: activityEase }}
                  >
                    {liveProgress.phase === 'awaiting_model' ? (
                      <div className="flex items-start gap-2.5">
                        <Loader2
                          className={`mt-0.5 h-4 w-4 shrink-0 animate-spin ${
                            isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                          }`}
                          aria-hidden
                        />
                        <div className="min-w-0 space-y-0.5">
                          <p className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                            Thinking
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                            Waiting for the model to respond…
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5">
                        <motion.div
                          initial={{ scale: 0.85 }}
                          animate={{ scale: 1 }}
                          transition={activitySpring}
                          className={`mt-0.5 flex h-7 w-7 shrink-0 animate-pulse items-center justify-center rounded-lg ${
                            liveProgress.toolName === 'create_task'
                              ? isDarkMode
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-emerald-50 text-emerald-700'
                              : liveProgress.toolName === 'update_task'
                                ? isDarkMode
                                  ? 'bg-amber-500/15 text-amber-400'
                                  : 'bg-amber-50 text-amber-800'
                                : liveProgress.toolName === 'delete_task'
                                  ? isDarkMode
                                    ? 'bg-rose-500/15 text-rose-400'
                                    : 'bg-rose-50 text-rose-700'
                                  : liveProgress.toolName === 'add_task_comment'
                                    ? isDarkMode
                                      ? 'bg-sky-500/15 text-sky-400'
                                      : 'bg-sky-50 text-sky-800'
                                    : liveProgress.toolName === 'undo_last_action'
                                      ? isDarkMode
                                        ? 'bg-violet-500/15 text-violet-300'
                                        : 'bg-violet-50 text-violet-800'
                                      : isDarkMode
                                        ? 'bg-indigo-500/15 text-indigo-300'
                                        : 'bg-indigo-50 text-indigo-700'
                          }`}
                          aria-hidden
                        >
                          {liveProgress.toolName === 'create_task' ? (
                            <ListPlus className="h-4 w-4" />
                          ) : liveProgress.toolName === 'update_task' ? (
                            <PencilLine className="h-4 w-4" />
                          ) : liveProgress.toolName === 'delete_task' ? (
                            <Trash2 className="h-4 w-4" />
                          ) : liveProgress.toolName === 'add_task_comment' ? (
                            <MessageSquarePlus className="h-4 w-4" />
                          ) : liveProgress.toolName === 'undo_last_action' ? (
                            <Undo2 className="h-4 w-4" />
                          ) : (
                            <Wrench className="h-4 w-4" />
                          )}
                        </motion.div>
                        <div className="min-w-0 space-y-0.5">
                          <p className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                            {toolProgressHeadline(liveProgress.toolName)}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                            {toolProgressLabel(liveProgress.toolName)}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        className={`border-t px-3 pb-3 pt-2.5 ${headerBg} ${isDarkMode ? 'border-zinc-800/90' : 'border-zinc-200/90'}`}
      >
        {openAiReady === false && (
          <p
            className={`mb-2.5 rounded-md border-l-2 border-amber-500/70 py-1.5 pl-2.5 pr-2 text-[11px] leading-snug ${
              isDarkMode ? 'bg-amber-500/5 text-amber-200/90' : 'bg-amber-50 text-amber-900'
            }`}
          >
            Set server-only{' '}
            <code className="rounded px-0.5 font-mono text-[10px] opacity-90">OPENAI_API_KEY</code> in Vercel (or run{' '}
            <code className="rounded px-0.5 font-mono text-[10px] opacity-90">vercel dev</code> locally with that env) to
            enable the assistant.
          </p>
        )}

        <div
          className={`flex min-h-[5.5rem] flex-col rounded-2xl transition-[box-shadow,background-color] focus-within:ring-2 ${
            isDarkMode
              ? 'bg-zinc-900/70 ring-1 ring-zinc-800/90 focus-within:bg-zinc-900/90 focus-within:ring-indigo-500/35'
              : 'bg-zinc-100/95 ring-1 ring-zinc-200/90 focus-within:bg-white focus-within:ring-indigo-500/25'
          }`}
        >
          {composerAttachments.length > 0 ? (
            <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto border-b px-2.5 py-2.5 sm:max-h-[min(40vh,14rem)]">
              <p
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
                }`}
              >
                Context
              </p>
              <div className="flex flex-col gap-2">
                {composerAttachments.map((t) => (
                  <TaskContextAttachment
                    key={t.id}
                    task={t}
                    isDarkMode={isDarkMode}
                    onRemove={() =>
                      setComposerAttachments((prev) => prev.filter((x) => x.id !== t.id))
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex min-h-[3rem] flex-1 items-end gap-1.5 px-2.5 pb-1 pt-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                boardLoading
                  ? 'Loading…'
                  : openAiReady === null
                    ? 'Checking assistant…'
                    : openAiReady === false
                      ? 'Assistant unavailable'
                      : composerAttachments.length > 0
                        ? 'Ask about these tasks…'
                        : 'Message… (drag tasks here)'
              }
              disabled={boardLoading || openAiReady !== true}
              rows={2}
              aria-label="Message to assistant"
              className={`max-h-[9rem] min-h-[2.75rem] flex-1 resize-none bg-transparent py-1 text-[13px] leading-snug placeholder:text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-zinc-500 ${
                isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
              }`}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!canSend}
              className={`mb-px flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
                !canSend
                  ? isDarkMode
                    ? 'bg-zinc-800 text-zinc-600'
                    : 'bg-zinc-200 text-zinc-400'
                  : isDarkMode
                    ? 'bg-indigo-500 text-white hover:bg-indigo-400 active:scale-95'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
              } disabled:pointer-events-none`}
              title="Send message"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4 stroke-[2.5]" aria-hidden />
            </button>
          </div>

          <div
            className={`flex flex-wrap items-center gap-1.5 border-t px-2.5 py-2 ${
              isDarkMode ? 'border-zinc-800/80' : 'border-zinc-200/90'
            }`}
          >
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                isDarkMode
                  ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/15'
                  : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
              }`}
              aria-current="true"
            >
              <Repeat2 className="h-3 w-3 shrink-0 opacity-95" strokeWidth={2.25} aria-hidden />
              Agent
            </span>
            <div className="relative inline-flex items-center">
              <label htmlFor="project-assistant-model" className="sr-only">
                Model
              </label>
              <select
                id="project-assistant-model"
                defaultValue={PROJECT_TASK_ASSISTANT_MODEL_OPTIONS[0].id}
                aria-label="Model"
                title="Model used for this assistant"
                className={`h-7 cursor-pointer appearance-none rounded-full py-0 pl-2.5 pr-7 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                  isDarkMode
                    ? 'bg-zinc-950/80 text-zinc-200 ring-1 ring-zinc-700/80 hover:bg-zinc-950'
                    : 'bg-white/90 text-zinc-700 ring-1 ring-zinc-200/90 hover:bg-white'
                }`}
              >
                {PROJECT_TASK_ASSISTANT_MODEL_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60 ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}
                aria-hidden
              />
            </div>
          </div>
        </div>
        <p
          className={`mt-2 px-1 text-center text-[10px] tabular-nums tracking-wide ${
            isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
          }`}
        >
          Enter to send · Shift+Enter new line
        </p>
      </div>
    </aside>
  );
}
