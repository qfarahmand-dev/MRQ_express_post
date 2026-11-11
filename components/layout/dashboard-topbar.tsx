'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { DashboardNav } from '@/components/layout/dashboard-sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DashboardTopbar() {
  const { t, dir } = useLanguage()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className={cn(buttonVariants({ variant: 'outline', size: 'icon-lg' }), 'lg:hidden')}
          aria-label={t.nav.openMenu}
        >
          <Menu aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side={dir === 'rtl' ? 'right' : 'left'} className="w-64 gap-0 border-0 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">{t.nav.mainNavigation}</SheetTitle>
          <DashboardNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        {user && (
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2.5 rounded-lg p-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold text-foreground">{user.fullName}</span>
              <span className="text-xs text-muted-foreground">{t.roles[user.role]}</span>
            </span>
          </Link>
        )}
      </div>
    </header>
  )
}
