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
