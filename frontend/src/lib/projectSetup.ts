/** Shared types + helpers for AI-assisted project setup and editable roadmaps. */

export interface RoadmapPhase {
  title: string;
  description: string;
}

export interface GeneratedSetupTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  type: 'feature' | 'scope' | 'bug';
  /** 1-based sprint; defaults to 1 when missing. */
  sprint?: number;
}

export interface ProjectSetupResult {
  title: string;
  description: string;
  phases: RoadmapPhase[];
  tasks: GeneratedSetupTask[];
}

/** Live draft shaped in the AI project builder chat workspace. */
export interface ProjectBuilderDraft {
  title: string;
  description: string;
  phases: RoadmapPhase[];
  tasks: GeneratedSetupTask[];
  /** Phase the builder is currently shaping (0-based), or null. */
  focusPhaseIndex: number | null;
}

export function emptyProjectBuilderDraft(): ProjectBuilderDraft {
  return {
    title: '',
    description: '',
    phases: [],
    tasks: [],
    focusPhaseIndex: null,
  };
}

export function draftToSetupResult(draft: ProjectBuilderDraft, fallbackBrief = ''): ProjectSetupResult {
  const title =
    draft.title.trim() ||
    titleFromBrief(fallbackBrief) ||
    'Untitled project';
  const description =
    draft.description.trim() ||
    fallbackBrief.trim().slice(0, 400) ||
    'No description added.';
  const phases =
    draft.phases.length > 0
      ? draft.phases
      : [
          {
            title: 'Get started',
            description: 'Clarify scope, set up the workspace, and ship a thin vertical slice.',
          },
        ];
  const tasks =
    draft.tasks.length > 0
      ? draft.tasks
      : [
          {
            title: 'Write a one-page brief',
            description: 'Capture goals, users, and non-goals for the first milestone.',
            priority: 'high' as const,
            type: 'scope' as const,
            sprint: 1,
          },
        ];
  return { title, description, phases, tasks };
}

export function isDraftReadyToCreate(draft: ProjectBuilderDraft): boolean {
  return draft.title.trim().length > 0 && draft.phases.length > 0;
}

export function serializeMasterPlan(phases: RoadmapPhase[]): string {
  return JSON.stringify(phases);
}

export function parseMasterPlan(raw: string | null | undefined): RoadmapPhase[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p): p is Record<string, unknown> => p != null && typeof p === 'object')
      .map((p) => ({
        title: String(p.title ?? '').trim() || 'Untitled phase',
        description: String(p.description ?? '').trim(),
      }))
      .filter((p) => p.title.length > 0);
  } catch {
    return [];
  }
}

export function titleFromBrief(brief: string, explicitTitle?: string): string {
  const named = explicitTitle?.trim();
  if (named) return named.slice(0, 80);
  const firstLine = brief.trim().split(/\n/)[0]?.trim() ?? '';
  if (!firstLine) return 'Untitled project';
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine;
}
