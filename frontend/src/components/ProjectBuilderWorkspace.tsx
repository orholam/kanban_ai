import { Flag, ListTodo, Map } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ProjectBuilderDraft } from '../lib/projectSetup';

interface ProjectBuilderWorkspaceProps {
  isDarkMode: boolean;
  draft: ProjectBuilderDraft;
  lastToolLabel: string | null;
}

function priorityTone(priority: string, isDarkMode: boolean): string {
  if (priority === 'high') {
    return isDarkMode ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-700';
  }
  if (priority === 'low') {
    return isDarkMode ? 'bg-zinc-700/60 text-zinc-400' : 'bg-zinc-200 text-zinc-600';
  }
  return isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800';
}

export default function ProjectBuilderWorkspace({
  isDarkMode,
  draft,
  lastToolLabel,
}: ProjectBuilderWorkspaceProps) {
  const muted = isDarkMode ? 'text-zinc-500' : 'text-zinc-500';
  const border = isDarkMode ? 'border-zinc-800' : 'border-zinc-200';
  const panel = isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50';
  const empty = !draft.title && draft.phases.length === 0 && draft.tasks.length === 0;
  const ease = [0.22, 1, 0.36, 1] as const;

  const completeness =
    (draft.title.trim() ? 1 : 0) +
    (draft.description.trim() ? 1 : 0) +
    (draft.phases.length >= 3 ? 1 : 0) +
    (draft.tasks.length >= 3 ? 1 : 0);
  const progressPct = (completeness / 4) * 100;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease }}
      className={`relative flex h-full min-h-0 flex-col border-t lg:border-l lg:border-t-0 ${border} ${panel}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-36 ${
          isDarkMode
            ? 'bg-[radial-gradient(55%_90%_at_80%_0%,rgba(63,63,70,0.5),transparent_70%)]'
            : 'bg-[radial-gradient(55%_90%_at_80%_0%,rgba(255,255,255,0.95),transparent_70%)]'
        }`}
        aria-hidden
      />

      <div className={`relative border-b px-4 py-4 ${border}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-xs font-medium ${muted}`}>Workspace</p>
            <h2
              className={`mt-1 truncate text-xl font-semibold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-zinc-950'
              }`}
            >
              {draft.title.trim() || 'Your project takes shape here'}
            </h2>
            {draft.description.trim() ? (
              <p className={`mt-1.5 line-clamp-2 text-sm leading-relaxed ${muted}`}>{draft.description}</p>
            ) : (
              <p className={`mt-1.5 text-sm ${muted}`}>Pitch and roadmap appear as we chat.</p>
            )}
          </div>
          <AnimatePresence mode="wait">
            {lastToolLabel ? (
              <motion.span
                key={lastToolLabel}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className={`shrink-0 pt-0.5 text-xs font-medium ${
                  isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                }`}
              >
                {lastToolLabel}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className={muted}>Build readiness</span>
            <span className={isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}>{completeness}/4</span>
          </div>
          <div className={`h-1.5 overflow-hidden rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {[
              { ok: Boolean(draft.title.trim()), label: 'Title' },
              { ok: Boolean(draft.description.trim()), label: 'Pitch' },
              { ok: draft.phases.length >= 3, label: 'Roadmap' },
              { ok: draft.tasks.length >= 3, label: 'Tasks' },
            ].map((item) => (
              <span
                key={item.label}
                className={item.ok ? (isDarkMode ? 'text-zinc-200' : 'text-zinc-800') : muted}
              >
                {item.ok ? '✓ ' : ''}
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
        {empty ? (
          <div className={`overflow-hidden rounded-2xl border ${border} ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
            <div
              className={`border-b px-4 py-3 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
            >
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-50' : 'text-zinc-950'}`}>
                Waiting for your pitch
              </p>
              <p className={`mt-0.5 text-xs ${muted}`}>
                Title, timeline, and first tasks land here after the first reply.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3">
              {['Identity', 'Timeline', 'Backlog'].map((label, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.06, duration: 0.3, ease }}
                  className={`min-h-[5.5rem] rounded-xl p-2.5 ${
                    isDarkMode ? 'bg-zinc-950/80' : 'bg-zinc-50'
                  }`}
                >
                  <span className={`text-[11px] font-semibold ${muted}`}>{label}</span>
                  <div
                    className={`mt-3 rounded-lg border border-dashed px-2 py-4 text-center text-[10px] ${
                      isDarkMode
                        ? 'border-zinc-800 text-zinc-600'
                        : 'border-zinc-200 text-zinc-400'
                    }`}
                  >
                    Empty
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}

        {draft.phases.length > 0 ? (
          <section>
            <h3 className={`mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${muted}`}>
              <Map className="h-3.5 w-3.5" aria-hidden />
              Timeline
              <span className="font-normal normal-case tracking-normal">· {draft.phases.length} phases</span>
            </h3>
            <ol
              className={`relative ml-2 space-y-0 border-l-2 border-dashed pl-5 ${
                isDarkMode ? 'border-zinc-700' : 'border-zinc-300'
              }`}
            >
              {draft.phases.map((phase, index) => {
                const focused = draft.focusPhaseIndex === index;
                return (
                  <motion.li
                    key={`${phase.title}-${index}`}
                    layout
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="relative pb-5 last:pb-0"
                  >
                    <span
                      className={`absolute -left-[1.55rem] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ${
                        isDarkMode ? 'ring-zinc-950' : 'ring-zinc-50'
                      } ${
                        focused
                          ? 'bg-indigo-500'
                          : isDarkMode
                            ? 'bg-zinc-600'
                            : 'bg-zinc-400'
                      }`}
                      aria-hidden
                    />
                    <div
                      className={`rounded-xl border px-3 py-2.5 ${
                        isDarkMode ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white'
                      } ${focused ? (isDarkMode ? 'ring-1 ring-indigo-400/40' : 'ring-1 ring-indigo-300') : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${muted}`}>Phase {index + 1}</span>
                        {focused ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                            }`}
                          >
                            <Flag className="h-3 w-3" />
                            Focus
                          </span>
                        ) : null}
                      </div>
                      <p className={`mt-1 text-sm font-semibold ${isDarkMode ? 'text-zinc-50' : 'text-zinc-900'}`}>
                        {phase.title}
                      </p>
                      {phase.description ? (
                        <p className={`mt-1 text-xs leading-relaxed ${muted}`}>{phase.description}</p>
                      ) : null}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {draft.tasks.length > 0 ? (
          <section>
            <h3 className={`mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${muted}`}>
              <ListTodo className="h-3.5 w-3.5" aria-hidden />
              First sprint board
              <span className="font-normal normal-case tracking-normal">· {draft.tasks.length} cards</span>
            </h3>
            <div
              className={`rounded-xl border p-3 ${
                isDarkMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-white'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-medium ${muted}`}>To do</span>
                <span className={`text-xs ${muted}`}>{draft.tasks.length}</span>
              </div>
              <ul className="space-y-2">
                {draft.tasks.map((task, index) => (
                  <motion.li
                    key={`${task.title}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`rounded-lg border px-3 py-2.5 ${
                      isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {task.title}
                      </p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityTone(
                          task.priority,
                          isDarkMode
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {task.type}
                      </span>
                    </div>
                    {task.description ? (
                      <p className={`mt-1 text-xs leading-relaxed ${muted}`}>{task.description}</p>
                    ) : null}
                  </motion.li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </div>
    </motion.aside>
  );
}

export function toolLabelForUi(toolName: string): string {
  switch (toolName) {
    case 'update_project_identity':
      return 'Updated pitch';
    case 'set_roadmap':
      return 'Updated roadmap';
    case 'set_starter_tasks':
      return 'Updated tasks';
    case 'set_focus_phase':
      return 'Focused phase';
    case 'request_create_board':
      return 'Creating board';
    default:
      return toolName;
  }
}

/** Friendly chat card for a completed workspace tool. */
export function describeBuilderAction(
  toolName: string,
  args: Record<string, unknown>,
  draft: ProjectBuilderDraft
): { title: string; detail: string; icon: 'identity' | 'roadmap' | 'tasks' | 'focus' | 'create' | 'generic' } {
  switch (toolName) {
    case 'update_project_identity': {
      const title = String(args.title ?? draft.title).trim() || 'Untitled';
      return {
        icon: 'identity',
        title: `Named the project “${title}”`,
        detail: 'Updated title and pitch in the workspace',
      };
    }
    case 'set_roadmap': {
      const phases = Array.isArray(args.phases) ? args.phases : draft.phases;
      const count = phases.length;
      const names = phases
        .slice(0, 3)
        .map((p) => {
          if (p && typeof p === 'object' && 'title' in p) return String((p as { title?: unknown }).title ?? '');
          return '';
        })
        .filter(Boolean);
      return {
        icon: 'roadmap',
        title: `Sketched a ${count}-phase roadmap`,
        detail: names.length ? names.join(' · ') : 'Milestone timeline updated',
      };
    }
    case 'set_starter_tasks': {
      const tasks = Array.isArray(args.tasks) ? args.tasks : draft.tasks;
      const count = tasks.length;
      const first = tasks[0];
      const firstTitle =
        first && typeof first === 'object' && 'title' in first
          ? String((first as { title?: unknown }).title ?? '')
          : '';
      return {
        icon: 'tasks',
        title: `Added ${count} starter task${count === 1 ? '' : 's'}`,
        detail: firstTitle ? `Including “${firstTitle}”` : 'First sprint backlog updated',
      };
    }
    case 'set_focus_phase': {
      const index = Number(args.index);
      const phase = Number.isFinite(index) ? draft.phases[Math.floor(index)] : null;
      return {
        icon: 'focus',
        title: phase?.title ? `Focused on “${phase.title}”` : 'Focused a roadmap phase',
        detail: 'Highlighted in the timeline',
      };
    }
    case 'request_create_board':
      return {
        icon: 'create',
        title: 'Creating your board',
        detail: String(args.reason ?? '').trim() || 'Taking you to the kanban',
      };
    default:
      return {
        icon: 'generic',
        title: toolLabelForUi(toolName),
        detail: 'Workspace updated',
      };
  }
}
