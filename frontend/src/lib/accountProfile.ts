import { supabase } from './supabase'
import type { AccountProfileRow, AccountRole, SubscriptionPlan } from '../types'

const DEFAULT_PROFILE: Pick<AccountProfileRow, 'account_role' | 'subscription_plan'> = {
  account_role: 'admin',
  subscription_plan: 'pro',
}

export async function fetchAccountProfile(userId: string): Promise<AccountProfileRow | null> {
  if (!userId.trim()) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, name, username, account_role, subscription_plan, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('fetchAccountProfile:', error.message)
    return null
  }
  if (!data) return null
  return data as AccountProfileRow
}

/** Defaults when the row is missing (should be rare after signup trigger + backfill). */
export function accountProfileDefaults(): Pick<AccountProfileRow, 'account_role' | 'subscription_plan'> {
  return { ...DEFAULT_PROFILE }
}

export async function upsertProfileDisplayFields(
  userId: string,
  displayName: string,
): Promise<{ error: Error | null }> {
  const trimmed = displayName.trim()
  const row = {
    id: userId,
    full_name: trimmed || null,
    display_name: trimmed || null,
    name: trimmed || null,
  }
  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' })
  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export function formatAccountRoleLabel(role: AccountRole): string {
  switch (role) {
    case 'owner':
      return 'Owner'
    case 'editor':
      return 'Editor'
    case 'admin':
      return 'Admin'
    default:
      return role
  }
}

export function formatSubscriptionPlanLabel(plan: SubscriptionPlan): string {
  return plan === 'pro' ? 'Pro' : 'Free'
}
