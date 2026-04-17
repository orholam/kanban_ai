import { supabase } from './supabase'
import { isLocalAppMode, LOCAL_DEV_USER_ID } from './localApp'

const PROFILE_NAME_KEYS = ['full_name', 'display_name', 'name', 'username'] as const

function profileRowToLabel(row: Record<string, unknown>): string | null {
  for (const key of PROFILE_NAME_KEYS) {
    const v = row[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

/** Resolve a user id to a display name via public `profiles` (anon client cannot read auth.users). */
export async function fetchProfileDisplayName(userId: string): Promise<string | null> {
  if (!userId.trim()) return null
  if (isLocalAppMode() && userId === LOCAL_DEV_USER_ID) {
    return 'Local developer'
  }
  if (isLocalAppMode()) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, display_name, name, username')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('fetchProfileDisplayName:', error.message)
    return null
  }
  if (!data) return null
  return profileRowToLabel(data as Record<string, unknown>)
}
