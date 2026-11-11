import type { Metadata } from 'next'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardTopbar } from '@/components/layout/dashboard-topbar'
import { AuthProvider } from '@/contexts/auth-context'

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | MRQ Express Post' },
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar />
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
