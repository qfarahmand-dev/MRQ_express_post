'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, UserRound } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth-service'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { ROLE_NAVIGATION } from '@/components/layout/dashboard-navigation'

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const { user, canAccess } = useAuth()
  const items = user ? ROLE_NAVIGATION[user.role] : ROLE_NAVIGATION.admin.slice(0, 1)
  const visibleItems = items.filter((item) => {
    if (!item.capability) return true
    const officeId = item.officeScoped && user?.role !== 'admin' ? user?.officeId ?? undefined : undefined
    return canAccess(item.capability, officeId)
  })

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
    <div className="flex h-full min-h-0 flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground">
      <Logo href="/dashboard" variant="light" className="px-2 pt-2" />
      <nav aria-label={t.nav.mainNavigation} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {visibleItems.map(({ href, label, icon: Icon, exact, exclude }) => {
          const matchesPath = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`)
          const active = matchesPath && (!exclude || !pathname.startsWith(exclude))
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
              <span className="leading-tight">{t.nav[label]}</span>
            </Link>
          )
        })}
      </nav>
      <div className="h-px bg-sidebar-border" />
      <Link
        href="/dashboard/profile"
        onClick={onNavigate}
        aria-current={pathname === '/dashboard/profile' ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/60',
          pathname === '/dashboard/profile'
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <UserRound className="size-4.5" aria-hidden="true" />
        <span className="leading-tight">{t.nav.profile}</span>
      </Link>
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
