import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Clears persisted auth and in-memory session, and emits SIGNED_OUT.
 * Needed when `signOut()` fails: `session_not_found` becomes `AuthSessionMissingError`,
 * which GoTrueClient does not treat like 401/403, so it returns without calling `_removeSession`.
 */
export async function clearLocalSupabaseSession(): Promise<void> {
  const auth = supabase.auth as unknown as { _removeSession(): Promise<void> }
  await auth._removeSession()
}
