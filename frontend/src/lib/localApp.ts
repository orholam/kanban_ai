/** Clone-and-run local mode: no Supabase in the browser, synthetic user, SQLite via `npm run dev:local`. */
export function isLocalAppMode(): boolean {
  return import.meta.env.VITE_LOCAL_MODE === 'true';
}

/** Stable UUID for all local `user_id` / collaborator rows (must match docs and server assumptions). */
export const LOCAL_DEV_USER_ID = '00000000-0000-4000-8000-000000000001';

export const LOCAL_DEV_EMAIL = 'local@dev.invalid';
