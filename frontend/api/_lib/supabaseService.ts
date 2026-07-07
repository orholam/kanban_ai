import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not configured');
  return url;
}

export function createServiceRoleClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) return null;
  return createClient(readSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
