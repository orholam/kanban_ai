import type { Project, Task } from '../types';

export const GUEST_PROJECT_ID = 'guest-local';

const STORAGE_KEY = 'kanban_guest_draft_v1';

const DEFAULT_TITLE = 'My board';
const DEFAULT_DESCRIPTION =
  'Your local draft board. Sign in to save it to your account.';

export interface GuestDraft {
  project: Project;
  tasks: Task[];
}

export function createDefaultGuestProject(): Project {
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return {
    id: GUEST_PROJECT_ID,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    master_plan: '',
    initial_prompt: '',
    keywords: '',
    projectType: 'Manual',
    num_sprints: 10,
    current_sprint: 1,
    due_date: due.toISOString(),
    achievements: '',
    complete: false,
    created_at: new Date().toISOString(),
    user_id: '',
    private: true,
    notes: '',
    tasks: [],
  };
}

function isDefaultTitle(title: string): boolean {
  return title.trim() === DEFAULT_TITLE;
}

function isDefaultDescription(description: string): boolean {
  return description.trim() === DEFAULT_DESCRIPTION;
}

export function guestDraftHasMeaningfulData(draft: GuestDraft | null): boolean {
  if (!draft) return false;
  if (draft.tasks.length > 0) return true;
  if (!isDefaultTitle(draft.project.title)) return true;
  if (!isDefaultDescription(draft.project.description)) return true;
  if ((draft.project.notes ?? '').trim().length > 0) return true;
  return false;
}

export function loadGuestDraft(): GuestDraft {
  if (typeof window === 'undefined') {
    return { project: createDefaultGuestProject(), tasks: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { project: createDefaultGuestProject(), tasks: [] };
    }
    const parsed = JSON.parse(raw) as Partial<GuestDraft>;
    const base = createDefaultGuestProject();
    if (!parsed.project || parsed.project.id !== GUEST_PROJECT_ID) {
      return { project: base, tasks: [] };
    }
    const project: Project = {
      ...base,
      ...parsed.project,
      id: GUEST_PROJECT_ID,
      tasks: [],
    };
    const rawTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const now = new Date().toISOString();
    const tasks = rawTasks.map((row) => {
      const t = row as Task;
      const created =
        typeof t.created_at === 'string' && t.created_at.trim() ? t.created_at : now;
      const updated =
        typeof t.updated_at === 'string' && t.updated_at.trim() ? t.updated_at : created;
      return { ...t, created_at: created, updated_at: updated };
    });
    return { project, tasks };
  } catch {
    return { project: createDefaultGuestProject(), tasks: [] };
  }
}

export function saveGuestDraft(draft: GuestDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        project: { ...draft.project, tasks: [] },
        tasks: draft.tasks,
      })
    );
  } catch {
    // ignore quota / private mode
  }
}

export function clearGuestDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function createDebouncedGuestSave(delayMs = 350) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (draft: GuestDraft) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      saveGuestDraft(draft);
      t = null;
    }, delayMs);
  };
}
