'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileChartColumnIncreasing, LayoutDashboard, LogOut, Package, PackagePlus, ScanSearch, UserRound } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth-service'
import { toast } from 'sonner'

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage()
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, exact: true },
    { href: '/dashboard/shipments/new', label: t.nav.newShipment, icon: PackagePlus, exact: true },
    { href: '/dashboard/shipments', label: t.nav.shipments, icon: Package, exclude: '/dashboard/shipments/new' },
    { href: '/dashboard/tracking', label: t.nav.trackingNumber, icon: ScanSearch, exact: true },
    { href: '/dashboard/reports', label: t.nav.reports, icon: FileChartColumnIncreasing, exact: true },
    { href: '/dashboard/profile', label: t.nav.profile, icon: UserRound, exact: true },
  ]

  async function handleLogout() {
    try {
      await authService.signOut()
      onNavigate?.()
      window.location.replace('/login')
    } catch {
      toast.error(t.common.unexpectedError)
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground">
      <Logo href="/dashboard" variant="light" className="px-2 pt-2" />
      <nav aria-label={t.nav.mainNavigation} className="flex flex-1 flex-col gap-1">
        {items.map(({ href, label, icon: Icon, exact, exclude }) => {
          const active = exact ? pathname === href : pathname.startsWith(href) && pathname !== exclude
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/60',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-sidebar-ring/60"
      >
        <LogOut className="size-4.5 rtl:rotate-180" aria-hidden="true" />
        {t.nav.logout}
      </button>
    </div>
  )
}

export function DashboardSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 lg:block">
      <DashboardNav />
    </aside>
  )
}
