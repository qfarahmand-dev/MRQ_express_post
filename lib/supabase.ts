import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

let client: SupabaseClient | null = null

/**
 * Centralized browser Supabase client. Uses only the publishable key —
 * never use a service_role or secret key in frontend code.
 * Returns null until the environment variables are configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!client) {
    client = createClient(supabaseUrl as string, supabasePublishableKey as string)
  }
  return client
}
