import type { Task } from '../types';

/** MIME type for full task payload when dragging from the board into the assistant. */
export const KANBAN_TASK_DRAG_MIME = 'application/x-kanban-task+json';

export function parseTaskFromDataTransfer(dt: DataTransfer, projectTasks: Task[]): Task | null {
  let fromJson: Task | null = null;
  const raw = dt.getData(KANBAN_TASK_DRAG_MIME);
  if (raw) {
    try {
      const t = JSON.parse(raw) as Task;
      if (typeof t?.id === 'string' && typeof t?.title === 'string') {
        fromJson = t;
      }
    } catch {
      /* ignore */
    }
  }

  const id =
    fromJson?.id ??
    (() => {
      const plain = dt.getData('text/plain')?.trim();
      return plain || undefined;
    })();

  if (!id) return null;

  const live = projectTasks.find((x) => x.id === id);
  if (live) return live;
  return fromJson;
}
