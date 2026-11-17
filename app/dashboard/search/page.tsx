import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AdvancedSearchView } from '@/components/search/advanced-search-view'

export const metadata: Metadata = { title: 'Advanced Search' }

export default async function SearchPage() {
  const supabase = await createServerSupabaseClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError && authError.name !== 'AuthSessionMissingError') throw authError
  if (!authData.user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return <AdvancedSearchView />
}
