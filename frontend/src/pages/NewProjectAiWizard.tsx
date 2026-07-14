import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, Check, Flag, ListTodo, Loader2, Map, Sparkles, Type } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ProjectBuilderWorkspace, {
  describeBuilderAction,
  toolLabelForUi,
} from '../components/ProjectBuilderWorkspace';
import { createProject } from '../api/createProject';
import { createTasks } from '../api/createTask';
import { useAuth } from '../contexts/AuthContext';
import {
  applyProjectBuilderTool,
  getOpenAiProxyConfigured,
  runProjectBuilderChat,
  type ProjectBuilderChatMessage,
} from '../lib/openai';
import {
  draftToSetupResult,
  emptyProjectBuilderDraft,
  isDraftReadyToCreate,
  serializeMasterPlan,
  type ProjectBuilderDraft,
} from '../lib/projectSetup';
import { formatDueDateForDb } from '../lib/taskDb';
import type { Project, Task } from '../types';

interface NewProjectAiWizardProps {
  isDarkMode: boolean;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

type ChatBubble =
  | {
      id: string;
      kind: 'message';
      role: 'user' | 'assistant';
      content: string;
    }
  | {
      id: string;
      kind: 'action';
      toolName: string;
      title: string;
      detail: string;
      icon: 'identity' | 'roadmap' | 'tasks' | 'focus' | 'generic';
    };

const WELCOME =
  "Pitch what you want to build in a sentence or two. I'll sketch the plan in the workspace right away — then we can tweak.";

function ActionIcon({
  icon,
  className,
}: {
  icon: 'identity' | 'roadmap' | 'tasks' | 'focus' | 'generic';
  className?: string;
}) {
  switch (icon) {
    case 'identity':
      return <Type className={className} aria-hidden />;
    case 'roadmap':
      return <Map className={className} aria-hidden />;
    case 'tasks':
      return <ListTodo className={className} aria-hidden />;
    case 'focus':
      return <Flag className={className} aria-hidden />;
    default:
      return <Check className={className} aria-hidden />;
  }
}

export default function NewProjectAiWizard({ isDarkMode, setProjects }: NewProjectAiWizardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProjectBuilderDraft>(() => emptyProjectBuilderDraft());
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const [messages, setMessages] = useState<ChatBubble[]>([
    { id: 'welcome', kind: 'message', role: 'assistant', content: WELCOME },
  ]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const [input, setInput] = useState('');
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const [lastToolLabel, setLastToolLabel] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const briefRef = useRef('');
  const busyRef = useRef(false);
  const queuedSendRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await getOpenAiProxyConfigured();
      if (!cancelled) setAiReady(ok);
    })();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingId, statusHint]);

  const focusInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  };

  const canCreate = isDraftReadyToCreate(draft) && !creating && Boolean(user);

  const runTurn = async (text: string, historyForApi: ProjectBuilderChatMessage[]) => {
    const assistantId = uuidv4();
    setMessages((prev) => [...prev, { id: assistantId, kind: 'message', role: 'assistant', content: '' }]);
    setBusy(true);
    busyRef.current = true;
    setStreamingId(assistantId);
    setStatusHint('Thinking…');
    setLastToolLabel(null);
    focusInput();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const finalText = await runProjectBuilderChat({
        priorMessages: historyForApi,
        userMessage: text,
        getDraft: () => draftRef.current,
        applyTool: (name, args) => {
          const { draft: next, result } = applyProjectBuilderTool(draftRef.current, name, args);
          draftRef.current = next;
          setDraft(next);
          setLastToolLabel(toolLabelForUi(name));
          const description = describeBuilderAction(name, args, next);
          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              kind: 'action',
              toolName: name,
              title: description.title,
              detail: description.detail,
              icon: description.icon,
            },
          ]);
          return result;
        },
        onProgress: (event) => {
          if (event.phase === 'awaiting_model') setStatusHint('Thinking…');
          if (event.phase === 'streaming') setStatusHint(null);
          if (event.phase === 'running_tool') {
            setStatusHint('Updating workspace…');
            setLastToolLabel(toolLabelForUi(event.toolName));
          }
        },
        onAssistantDelta: (delta) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId && m.kind === 'message' ? { ...m, content: delta } : m
            )
          );
        },
        signal: controller.signal,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.kind === 'message' ? { ...m, content: finalText } : m
        )
      );
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('Project builder chat failed:', err);
      toast.error(err instanceof Error ? err.message : 'Chat failed');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.kind === 'message'
            ? {
                ...m,
                content:
                  m.content.trim() ||
                  'Something went wrong on my side. Try sending that again.',
              }
            : m
        )
      );
    } finally {
      if (!controller.signal.aborted) {
        setBusy(false);
        busyRef.current = false;
        setStreamingId(null);
        setStatusHint(null);
        focusInput();

        const queued = queuedSendRef.current;
        if (queued) {
          queuedSendRef.current = null;
          void sendMessage(queued);
        }
      }
    }
  };

  const sendMessage = async (raw: string) => {
    if (!user || creating) return;
    const text = raw.trim();
    if (!text) return;

    if (aiReady === false) {
      toast.error('AI is not configured. Use a blank board or set OPENAI_API_KEY.');
      return;
    }

    if (busyRef.current) {
      queuedSendRef.current = text;
      setInput('');
      focusInput();
      toast.message('Queued — will send when this reply finishes');
      return;
    }

    if (!briefRef.current) briefRef.current = text;

    const userBubble: ChatBubble = { id: uuidv4(), kind: 'message', role: 'user', content: text };
    const prior: ProjectBuilderChatMessage[] = messagesRef.current
      .filter((m): m is Extract<ChatBubble, { kind: 'message' }> => m.kind === 'message')
      .filter((m) => m.id !== 'welcome' && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userBubble]);
    setInput('');
    focusInput();
    await runTurn(text, prior);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };
  const handleCreateBoard = async () => {
    if (!user || !canCreate) return;
    setCreating(true);
    try {
      const setup = draftToSetupResult(draft, briefRef.current);
      const projectId = uuidv4();
      const now = new Date().toISOString();
      const due = new Date();
      due.setDate(due.getDate() + 7);
      const dueYmd = formatDueDateForDb(due);
      const numSprints = Math.max(1, Math.min(52, setup.phases.length));

      const newProject = {
        id: projectId,
        title: setup.title,
        description: setup.description,
        master_plan: serializeMasterPlan(setup.phases),
        initial_prompt: briefRef.current || setup.description,
        keywords: '',
        projectType: 'AI',
        num_sprints: numSprints,
        current_sprint: 1,
        complete: false,
        created_at: now,
        due_date: due.toISOString(),
        achievements: '',
        user_id: user.id,
        private: true,
        notes: '',
      };

      const collaborator = {
        id: uuidv4(),
        project_id: projectId,
        user_id: user.id,
        invited_at: now,
        accepted: true,
        role: 'owner',
      };

      const tasks: Task[] = setup.tasks.map((t) => {
        const ts = new Date().toISOString();
        const sprint = Math.min(numSprints, Math.max(1, t.sprint ?? 1));
        return {
          id: uuidv4(),
          project_id: projectId,
          title: t.title,
          description: t.description,
          priority: t.priority,
          type: t.type,
          status: 'todo',
          sprint,
          due_date: dueYmd,
          assignee_id: user.id,
          created_at: ts,
          updated_at: ts,
        };
      });

      await createProject(newProject, collaborator);
      await createTasks(tasks);
      setProjects((prev) => [...prev, { ...newProject, tasks: [] }]);
      navigate(`/project/${projectId}`);
    } catch (err) {
      console.error('Create board failed:', err);
      toast.error(err instanceof Error ? err.message : 'Could not create project');
      setCreating(false);
    }
  };

  const shell = isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900';
  const border = isDarkMode ? 'border-zinc-800' : 'border-zinc-200';
  const muted = isDarkMode ? 'text-zinc-500' : 'text-zinc-500';
  const userBubble = isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white';
  const assistantBubble = isDarkMode
    ? 'bg-zinc-900 border border-zinc-800 text-zinc-200'
    : 'bg-zinc-100 border border-zinc-200 text-zinc-800';

  return (
    <div className={`flex h-full min-h-0 flex-1 flex-col ${shell}`}>
      <header className={`flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4 ${border}`}>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/new-project"
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
              isDarkMode ? 'text-zinc-300 hover:bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Blank board</span>
          </Link>
          <div className={`hidden h-4 w-px sm:block ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Project builder</p>
              <p className={`truncate text-xs ${muted}`}>Chat to shape the plan · workspace updates live</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => void handleCreateBoard()}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-40"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {creating ? 'Creating…' : 'Create board'}
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(12rem,38vh)] lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:grid-rows-1">
        <section className={`flex min-h-0 flex-col border-b lg:border-b-0 ${border}`}>
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
            {messages.map((m) => {
              if (m.kind === 'action') {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div
                      className={`inline-flex max-w-[min(40rem,92%)] items-start gap-2.5 rounded-2xl border px-3 py-2.5 ${
                        isDarkMode
                          ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-950'
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <ActionIcon icon={m.icon} className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug">{m.title}</p>
                        <p
                          className={`mt-0.5 text-xs leading-relaxed ${
                            isDarkMode ? 'text-emerald-200/70' : 'text-emerald-800/75'
                          }`}
                        >
                          {m.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              const isStreaming = m.id === streamingId && !m.content;
              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[min(40rem,92%)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user' ? userBubble : assistantBubble
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      m.content ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      ) : isStreaming ? (
                        <span className={`inline-flex items-center gap-2 ${muted}`}>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          {statusHint || 'Thinking…'}
                        </span>
                      ) : null
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {busy &&
            statusHint &&
            streamingId &&
            messages.some((m) => m.kind === 'message' && m.id === streamingId && m.content) ? (
              <p className={`px-1 text-xs ${muted}`}>{statusHint}</p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className={`shrink-0 border-t p-3 sm:p-4 ${border}`}>
            {aiReady === false ? (
              <p
                className={`mb-2 rounded-lg border px-3 py-2 text-xs ${
                  isDarkMode
                    ? 'border-amber-800/50 bg-amber-950/40 text-amber-200'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                AI is not configured. Set <code className="font-mono">OPENAI_API_KEY</code> or use a blank board.
              </p>
            ) : null}
            <div
              className={`flex items-end gap-2 rounded-2xl border px-3 py-2 ${
                isDarkMode ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-300 bg-zinc-50'
              }`}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input);
                  }
                }}
                rows={2}
                disabled={creating || aiReady === false}
                autoFocus
                placeholder={
                  busy
                    ? 'Keep typing — send will queue until this reply finishes…'
                    : 'Describe the idea, or ask to change the roadmap…'
                }
                className={`max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-zinc-500 disabled:opacity-60 ${
                  isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                }`}
              />
              <button
                type="submit"
                disabled={creating || aiReady === false || !input.trim()}
                className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className={`mt-2 text-[11px] ${muted}`}>
              {busy ? 'Reply in progress — you can still type' : 'Enter to send · Shift+Enter for newline'}
              {canCreate ? ' · Create board when the workspace looks right' : ''}
            </p>
          </form>
        </section>

        <ProjectBuilderWorkspace isDarkMode={isDarkMode} draft={draft} lastToolLabel={lastToolLabel} />
      </div>
    </div>
  );
}
