/** Canonical public site URL (no trailing slash). */
export const SITE_ORIGIN = 'https://kanbanai.dev';

export const SITE_NAME = 'Kanban AI';

/** Shown on landing variant B “Introducing …” pill (marketing label, not package semver). */
export const LANDING_HERO_VERSION_TAG = 'v0.1';

export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;

/** Default document title — brand + high-intent queries from Search Console. */
export const DEFAULT_TITLE =
  'Kanban AI — AI Kanban Board with AI Task Planning & MCP';

/** Meta description tuned for “ai kanban” / “ai kanban board” SERP CTR. */
export const DEFAULT_DESCRIPTION =
  'AI kanban board for builders and small teams: AI task planning, smart columns, sprints, and Cursor/Claude MCP. Try a free guest board — no signup required.';

export const DEFAULT_KEYWORDS =
  'kanban AI, AI kanban, AI kanban board, kanban software with ai, AI task management, kanban app, sprint planning, MCP, side projects';

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
