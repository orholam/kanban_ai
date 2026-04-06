/** Canonical public site URL (no trailing slash). */
export const SITE_ORIGIN = 'https://kanbanai.dev';

export const SITE_NAME = 'Kanban AI';

export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

/** Default document title — lead with brand + target query. */
export const DEFAULT_TITLE =
  'Kanban AI — AI kanban boards, smart columns & AI task planning';

/** Meta description: natural “kanban AI” phrasing for SERP snippets. */
export const DEFAULT_DESCRIPTION =
  'Kanban AI is the kanban AI app for shipping faster: AI-powered columns and cards, sprint planning, and task breakdowns for builders and small teams. Try a guest board with no signup.';

export const DEFAULT_KEYWORDS =
  'kanban AI, Kanban AI, AI kanban board, AI task management, kanban app, sprint planning, side projects';

export const WORKBENCH_DESCRIPTION =
  'Your private Kanban AI workspace — tasks, columns, and sprints.';

/** Paths that should not be indexed (boards, analytics, public shares). */
export function isWorkbenchPath(pathname: string): boolean {
  if (pathname === '/kanban') return true;
  if (pathname.startsWith('/project/')) return true;
  if (pathname.startsWith('/new-project')) return true;
  if (pathname === '/analytics') return true;
  if (pathname.startsWith('/public/project/')) return true;
  return false;
}
