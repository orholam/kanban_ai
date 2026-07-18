import React, { useEffect, useState } from 'react';
import { ChevronDown, Map, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateProjectRow } from '../lib/boardDb';
import { parseMasterPlan, serializeMasterPlan, type RoadmapPhase } from '../lib/projectSetup';

interface ProjectRoadmapPanelProps {
  isDarkMode: boolean;
  projectId: string;
  masterPlan: string;
  onMasterPlanChange: (next: string) => void;
  disabled?: boolean;
}

export default function ProjectRoadmapPanel({
  isDarkMode,
  projectId,
  masterPlan,
  onMasterPlanChange,
  disabled = false,
}: ProjectRoadmapPanelProps) {
  const [open, setOpen] = useState(() => {
    // Keep the board chrome short on phones (browser chrome already eats height).
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      return false;
    }
    return parseMasterPlan(masterPlan).length > 0;
  });
  const [phases, setPhases] = useState<RoadmapPhase[]>(() => parseMasterPlan(masterPlan));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPhases(parseMasterPlan(masterPlan));
  }, [masterPlan]);

  const persist = async (next: RoadmapPhase[]) => {
    const serialized = serializeMasterPlan(next);
    if (serialized === masterPlan) return;
    setSaving(true);
    onMasterPlanChange(serialized);
    try {
      await updateProjectRow(projectId, { master_plan: serialized });
    } catch (err) {
      console.error('Failed to save roadmap:', err);
      toast.error(err instanceof Error ? err.message : 'Could not save roadmap');
      onMasterPlanChange(masterPlan);
      setPhases(parseMasterPlan(masterPlan));
    } finally {
      setSaving(false);
    }
  };

  const updatePhase = (index: number, patch: Partial<RoadmapPhase>) => {
    setPhases((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const commitPhases = () => {
    void persist(phases);
  };

  const addPhase = () => {
    const next = [...phases, { title: `Phase ${phases.length + 1}`, description: '' }];
    setPhases(next);
    setOpen(true);
    void persist(next);
  };

  const removePhase = (index: number) => {
    const next = phases.filter((_, i) => i !== index);
    setPhases(next);
    void persist(next);
  };

  const shell = isDarkMode
    ? 'border-zinc-800/90 bg-zinc-900/35'
    : 'border-zinc-200/70 bg-zinc-100/40';
  const field = `w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 ${
    isDarkMode
      ? 'border-zinc-700 text-zinc-100 placeholder:text-zinc-600'
      : 'border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
  }`;

  return (
    <section className={`mb-3 rounded-xl border ${shell} sm:mb-4`}>
      <div className="flex items-center gap-1 px-2 py-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
            isDarkMode ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200' : 'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800'
          }`}
          aria-expanded={open}
        >
          <Map className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">Roadmap</span>
          <span className={`font-normal normal-case tracking-normal ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {phases.length === 0 ? 'empty' : `${phases.length} phase${phases.length === 1 ? '' : 's'}`}
            {saving ? ' · saving…' : ''}
          </span>
          <ChevronDown
            className={`ml-auto h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={addPhase}
          disabled={disabled || saving}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            isDarkMode
              ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
          }`}
          aria-label="Add roadmap phase"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add
        </button>
      </div>

      {open ? (
        <div className="space-y-2 border-t border-inherit px-3 pb-3 pt-2">
          {phases.length === 0 ? (
            <p className={`px-1 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
              No roadmap yet. Add a phase, or ask the AI assistant to draft one.
            </p>
          ) : (
            phases.map((phase, index) => (
              <div
                key={`phase-${index}`}
                className={`overflow-hidden rounded-lg border p-2.5 ${
                  isDarkMode ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200/80 bg-white/70'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 w-5 shrink-0 text-center text-[10px] font-semibold tabular-nums ${
                      isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <input
                        type="text"
                        value={phase.title}
                        disabled={disabled || saving}
                        onChange={(e) => updatePhase(index, { title: e.target.value })}
                        onBlur={commitPhases}
                        className={`${field} min-w-0 flex-1 font-medium`}
                        aria-label={`Phase ${index + 1} title`}
                        placeholder="Phase title"
                      />
                      <button
                        type="button"
                        onClick={() => removePhase(index)}
                        disabled={disabled || saving}
                        className={`mt-0.5 shrink-0 rounded-md p-1.5 transition-colors disabled:opacity-50 ${
                          isDarkMode
                            ? 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300'
                            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
                        }`}
                        aria-label={`Remove phase ${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <textarea
                      value={phase.description}
                      disabled={disabled || saving}
                      onChange={(e) => updatePhase(index, { description: e.target.value })}
                      onBlur={commitPhases}
                      rows={2}
                      className={`${field} max-w-full resize-y text-xs leading-relaxed`}
                      aria-label={`Phase ${index + 1} description`}
                      placeholder="What should be true when this phase is done?"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
