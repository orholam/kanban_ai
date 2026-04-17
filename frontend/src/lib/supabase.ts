import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isLocalAppMode } from './localApp';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function createHostedClient(): SupabaseClient {
  if (!supabaseUrl?.trim() || !supabaseKey?.trim()) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Hosted: real Supabase. Local mode (`VITE_LOCAL_MODE`): inert client so imports stay typed;
 * do not call into it — use `boardDb` / `isLocalAppMode()` instead.
 */
export const supabase: SupabaseClient = isLocalAppMode()
  ? createClient('http://127.0.0.1:1', 'local-mode-placeholder', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : createHostedClient();

/**
 * Clears persisted auth and in-memory session, and emits SIGNED_OUT.
 * Needed when `signOut()` fails: `session_not_found` becomes `AuthSessionMissingError`,
 * which GoTrueClient does not treat like 401/403, so it returns without calling `_removeSession`.
 */
export async function clearLocalSupabaseSession(): Promise<void> {
  if (isLocalAppMode()) return;
  const auth = supabase.auth as unknown as { _removeSession(): Promise<void> };
  await auth._removeSession();
}
