import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'
import { isUserRole } from '@/types/user'

export async function getManagementContext() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return { response: Response.json({ error: 'server_not_configured' }, { status: 503 }) } as const
  }

  const sessionClient = await createServerSupabaseClient()
  const { data: authData, error: authError } = await sessionClient.auth.getUser()
  if (authError || !authData.user) {
    return { response: Response.json({ error: 'unauthenticated' }, { status: 401 }) } as const
  }

  const { data: profile, error: profileError } = await sessionClient
    .from('profiles')
    .select('id, role, office_id, account_status')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (profileError) {
    return { response: Response.json({ error: 'profile_lookup_failed' }, { status: 500 }) } as const
  }
  if (!profile || profile.account_status !== 'active' || !isUserRole(profile.role)) {
    return { response: Response.json({ error: 'forbidden' }, { status: 403 }) } as const
  }
  let actor:
    | { id: string; role: 'admin'; officeId: null }
    | { id: string; role: 'office_manager' | 'storekeeper'; officeId: string }
  if (profile.role === 'admin') {
    actor = { id: profile.id, role: 'admin', officeId: null }
  } else {
    if (!profile.office_id) {
      return { response: Response.json({ error: 'office_assignment_required' }, { status: 403 }) } as const
    }
    const { data: office, error: officeError } = await sessionClient
      .from('offices')
      .select('status')
      .eq('id', profile.office_id)
      .maybeSingle()
    if (officeError) {
      return { response: Response.json({ error: 'office_lookup_failed' }, { status: 500 }) } as const
    }
    if (office?.status !== 'active') {
      return { response: Response.json({ error: 'office_inactive' }, { status: 403 }) } as const
    }
    actor = { id: profile.id, role: profile.role, officeId: profile.office_id }
  }
  const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return {
    context: {
      adminClient,
      actor,
    },
  } as const
}
