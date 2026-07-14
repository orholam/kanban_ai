import { Flag, ListTodo, Map, Sparkles, Target } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ProjectBuilderDraft } from '../lib/projectSetup';

interface ProjectBuilderWorkspaceProps {
  isDarkMode: boolean;
  draft: ProjectBuilderDraft;
  lastToolLabel: string | null;
}

const PHASE_COLORS = [
  { bar: 'from-sky-500 to-cyan-400', glow: 'bg-sky-500', soft: 'bg-sky-500/15 text-sky-300' },
  { bar: 'from-violet-500 to-fuchsia-400', glow: 'bg-violet-500', soft: 'bg-violet-500/15 text-violet-300' },
  { bar: 'from-amber-500 to-orange-400', glow: 'bg-amber-500', soft: 'bg-amber-500/15 text-amber-300' },
  { bar: 'from-emerald-500 to-teal-400', glow: 'bg-emerald-500', soft: 'bg-emerald-500/15 text-emerald-300' },
  { bar: 'from-rose-500 to-pink-400', glow: 'bg-rose-500', soft: 'bg-rose-500/15 text-rose-300' },
  { bar: 'from-indigo-500 to-blue-400', glow: 'bg-indigo-500', soft: 'bg-indigo-500/15 text-indigo-300' },
];

const PHASE_COLORS_LIGHT = [
  { bar: 'from-sky-500 to-cyan-400', glow: 'bg-sky-500', soft: 'bg-sky-100 text-sky-800' },
  { bar: 'from-violet-500 to-fuchsia-400', glow: 'bg-violet-500', soft: 'bg-violet-100 text-violet-800' },
  { bar: 'from-amber-500 to-orange-400', glow: 'bg-amber-500', soft: 'bg-amber-100 text-amber-900' },
  { bar: 'from-emerald-500 to-teal-400', glow: 'bg-emerald-500', soft: 'bg-emerald-100 text-emerald-800' },
  { bar: 'from-rose-500 to-pink-400', glow: 'bg-rose-500', soft: 'bg-rose-100 text-rose-800' },
  { bar: 'from-indigo-500 to-blue-400', glow: 'bg-indigo-500', soft: 'bg-indigo-100 text-indigo-800' },
];

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
  const panel = isDarkMode
    ? 'bg-[radial-gradient(120%_80%_at_10%_0%,rgba(99,102,241,0.18),transparent_50%),radial-gradient(90%_60%_at_100%_20%,rgba(16,185,129,0.12),transparent_45%),#09090b]'
    : 'bg-[radial-gradient(120%_80%_at_10%_0%,rgba(99,102,241,0.12),transparent_50%),radial-gradient(90%_60%_at_100%_20%,rgba(14,165,233,0.1),transparent_45%),#f8fafc]';
  const colors = isDarkMode ? PHASE_COLORS : PHASE_COLORS_LIGHT;
  const empty = !draft.title && draft.phases.length === 0 && draft.tasks.length === 0;

  const completeness =
    (draft.title.trim() ? 1 : 0) +
    (draft.description.trim() ? 1 : 0) +
    (draft.phases.length >= 3 ? 1 : 0) +
    (draft.tasks.length >= 3 ? 1 : 0);
  const progressPct = (completeness / 4) * 100;

  return (
    <aside className={`flex h-full min-h-0 flex-col border-t lg:border-l lg:border-t-0 ${border} ${panel}`}>
      <div className={`relative overflow-hidden border-b px-4 py-4 ${border}`}>
        <div
          className={`pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-3xl ${
            isDarkMode ? 'bg-indigo-500/30' : 'bg-indigo-400/25'
          }`}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
              }`}
            >
              Workspace
            </p>
            <h2
              className={`mt-1 truncate text-xl font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-zinc-900'
              }`}
            >
              {draft.title.trim() || 'Your project takes shape here'}
            </h2>
            {draft.description.trim() ? (
              <p className={`mt-1.5 line-clamp-2 text-sm leading-relaxed ${muted}`}>{draft.description}</p>
            ) : (
              <p className={`mt-1.5 text-sm ${muted}`}>Pitch + roadmap appear as we chat.</p>
            )}
          </div>
          <AnimatePresence mode="wait">
            {lastToolLabel ? (
              <motion.span
                key={lastToolLabel}
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4 }}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  isDarkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <Sparkles className="h-3 w-3" aria-hidden />
                {lastToolLabel}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="relative mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className={muted}>Build readiness</span>
            <span className={isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}>{completeness}/4</span>
          </div>
          <div className={`h-1.5 overflow-hidden rounded-full ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { ok: Boolean(draft.title.trim()), label: 'Title' },
              { ok: Boolean(draft.description.trim()), label: 'Pitch' },
              { ok: draft.phases.length >= 3, label: 'Roadmap' },
              { ok: draft.tasks.length >= 3, label: 'Tasks' },
            ].map((chip) => (
              <span
                key={chip.label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  chip.ok
                    ? isDarkMode
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-emerald-100 text-emerald-800'
                    : isDarkMode
                      ? 'bg-zinc-800 text-zinc-500'
                      : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
        {empty ? (
          <div
            className={`relative overflow-hidden rounded-2xl border border-dashed p-6 ${border} ${
              isDarkMode ? 'bg-zinc-900/40' : 'bg-white/70'
            }`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(99,102,241,0.08)_100%)]" />
            <div className="relative space-y-3">
              <div className="flex items-center gap-2">
                <Target className={`h-4 w-4 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Waiting for your pitch
                </p>
              </div>
              <p className={`text-sm leading-relaxed ${muted}`}>
                Send what you want to build. I&apos;ll drop a title, timeline, and first tasks here in the first
                reply — then you can tweak.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['Identity', 'Timeline', 'Backlog'].map((label, i) => (
                  <div
                    key={label}
                    className={`rounded-xl border px-2 py-3 text-center text-[11px] font-medium ${border} ${muted}`}
                  >
                    <div
                      className={`mx-auto mb-2 h-1.5 w-8 rounded-full bg-gradient-to-r ${colors[i].bar}`}
                    />
                    {label}
                  </div>
                ))}
              </div>
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
            >              {draft.phases.map((phase, index) => {
                const focused = draft.focusPhaseIndex === index;
                const tone = colors[index % colors.length];
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
                      className={`absolute -left-[1.55rem] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ${
                        isDarkMode ? 'ring-zinc-950' : 'ring-zinc-50'
                      } ${tone.glow} ${focused ? 'scale-125' : ''}`}
                      aria-hidden
                    />
                    <div
                      className={`overflow-hidden rounded-2xl border ${
                        isDarkMode ? 'border-zinc-800 bg-zinc-900/70' : 'border-zinc-200 bg-white shadow-sm'
                      } ${focused ? (isDarkMode ? 'ring-1 ring-indigo-400/40' : 'ring-1 ring-indigo-300') : ''}`}
                    >
                      <div className={`h-1 w-full bg-gradient-to-r ${tone.bar}`} />
                      <div className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${tone.soft}`}>
                            Phase {index + 1}
                          </span>
                          {focused ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${
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
              className={`rounded-2xl border p-3 ${
                isDarkMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-white/80'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}
                >
                  To do
                </span>
                <span className={`text-[11px] ${muted}`}>{draft.tasks.length}</span>
              </div>
              <ul className="space-y-2">
                {draft.tasks.map((task, index) => (
                  <motion.li
                    key={`${task.title}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`rounded-xl border px-3 py-2.5 ${
                      isDarkMode
                        ? 'border-zinc-700/80 bg-gradient-to-br from-zinc-900 to-zinc-950'
                        : 'border-zinc-200 bg-gradient-to-br from-white to-zinc-50 shadow-sm'
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
    </aside>
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
    default:
      return toolName;
  }
}

/** Friendly chat card for a completed workspace tool. */
export function describeBuilderAction(
  toolName: string,
  args: Record<string, unknown>,
  draft: ProjectBuilderDraft
): { title: string; detail: string; icon: 'identity' | 'roadmap' | 'tasks' | 'focus' | 'generic' } {
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
    default:
      return {
        icon: 'generic',
        title: toolLabelForUi(toolName),
        detail: 'Workspace updated',
      };
  }
}
