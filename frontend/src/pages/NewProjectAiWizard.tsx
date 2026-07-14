import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { NewProjectPageLayout } from '../components/NewProjectPageLayout';
import { createProject } from '../api/createProject';
import { createTasks } from '../api/createTask';
import { useAuth } from '../contexts/AuthContext';
import { generateProjectSetup, getOpenAiProxyConfigured } from '../lib/openai';
import { serializeMasterPlan } from '../lib/projectSetup';
import { formatDueDateForDb } from '../lib/taskDb';
import type { Project, Task } from '../types';

interface NewProjectAiWizardProps {
  isDarkMode: boolean;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

type SetupPhase = 'idle' | 'checking' | 'generating' | 'creating';

export default function NewProjectAiWizard({ isDarkMode, setProjects }: NewProjectAiWizardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [brief, setBrief] = useState('');
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<SetupPhase>('idle');
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setPhase('checking');
      const ok = await getOpenAiProxyConfigured();
      if (!cancelled) {
        setAiReady(ok);
        setPhase('idle');
      }
    })();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  const busy = phase === 'generating' || phase === 'creating' || phase === 'checking';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || busy) return;

    const trimmedBrief = brief.trim();
    if (!trimmedBrief) {
      toast.error('Describe what you want to build');
      return;
    }

    if (aiReady === false) {
      toast.error('AI is not configured. Use a blank board or set OPENAI_API_KEY.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('generating');
    try {
      const setup = await generateProjectSetup({
        brief: trimmedBrief,
        title: title.trim() || undefined,
        signal: controller.signal,
      });

      setPhase('creating');
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
        initial_prompt: trimmedBrief,
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
      if (controller.signal.aborted) return;
      console.error('AI project setup failed:', err);
      toast.error(err instanceof Error ? err.message : 'Could not create project');
      setPhase('idle');
    }
  };

  const inputClass = `w-full rounded-xl border px-3.5 py-2.5 text-sm transition-shadow ${
    isDarkMode
      ? 'border-gray-600 bg-gray-800/80 text-white placeholder:text-gray-500'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400'
  } focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500`;

  const statusLabel =
    phase === 'checking'
      ? 'Checking AI…'
      : phase === 'generating'
        ? 'Drafting roadmap and tasks…'
        : phase === 'creating'
          ? 'Creating your board…'
          : null;

  return (
    <NewProjectPageLayout isDarkMode={isDarkMode}>
      <Link
        to="/new-project"
        className={`mb-8 inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
          isDarkMode
            ? 'border-gray-600 bg-gray-800/60 text-gray-200 hover:border-gray-500 hover:bg-gray-800'
            : 'border-gray-200 bg-white/80 text-gray-700 shadow-sm hover:border-gray-300 hover:bg-white'
        }`}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Blank board instead
      </Link>

      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md`}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.2em] ${
              isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
            }`}
          >
            AI setup
          </p>
        </div>
        <h1
          className={`text-3xl font-bold tracking-tight sm:text-4xl ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Describe the project
        </h1>
        <p className={`mt-3 max-w-xl text-base leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          One brief. We draft a roadmap and starter tasks, then open your board — edit anything there.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className={`rounded-2xl border p-6 shadow-xl backdrop-blur-md sm:p-8 ${
          isDarkMode
            ? 'border-gray-700/80 bg-gray-900/80 shadow-gray-950/40'
            : 'border-gray-200/90 bg-white/90 shadow-gray-900/[0.04]'
        }`}
      >
        <div className="space-y-6">
          <div>
            <label
              htmlFor="ai-project-brief"
              className={`mb-2 block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            >
              Brief
            </label>
            <textarea
              id="ai-project-brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={8}
              required
              disabled={busy}
              autoFocus
              className={`${inputClass} min-h-[10rem] resize-y`}
              placeholder="What are you building, who is it for, and any stack or constraints that matter?"
            />
          </div>

          <div>
            <label
              htmlFor="ai-project-title"
              className={`mb-2 block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            >
              Title <span className="font-normal opacity-70">(optional)</span>
            </label>
            <input
              id="ai-project-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              className={inputClass}
              placeholder="Leave blank to name it from the brief"
              autoComplete="off"
            />
          </div>

          {aiReady === false ? (
            <p
              className={`rounded-xl border px-3.5 py-3 text-sm ${
                isDarkMode
                  ? 'border-amber-800/50 bg-amber-950/40 text-amber-200'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
              role="status"
            >
              AI is not configured on this deployment. Use a blank board, or set{' '}
              <code className="text-xs">OPENAI_API_KEY</code> for the OpenAI proxy.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || aiReady === false || !brief.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-50"
          >
            {statusLabel ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {statusLabel}
              </>
            ) : (
              <>
                Create project
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>
    </NewProjectPageLayout>
  );
}
