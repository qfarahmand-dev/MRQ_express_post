import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardTopbar } from '@/components/layout/dashboard-topbar'
import { AuthProvider } from '@/contexts/auth-context'
import { isSupabaseConfigured } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | MRQ Express Post' },
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) redirect('/login')

  const supabase = await createServerSupabaseClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!authData.user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle()
  if (error) throw error
  if (profile?.role !== 'admin') redirect('/login')

  return (
    <AuthProvider>
      <div className="flex min-h-dvh rtl:flex-row-reverse">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar />
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
