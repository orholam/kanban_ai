import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return {
      id: data.id,
      email: data.email,
      name: data.raw_user_meta_data?.name || data.email?.split('@')[0] || 'Unknown User'
    }
  } catch (error) {
    console.error('Error in getUserById:', error)
    return null
  }
} 