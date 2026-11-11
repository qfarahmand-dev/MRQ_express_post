'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn, Menu } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const { t, dir } = useLanguage()
  const pathname = usePathname()

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/#about', label: t.nav.about },
    { href: '/#contact', label: t.nav.contact },
    { href: '/track', label: t.nav.track },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label={t.nav.mainNavigation} className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary',
                pathname === link.href && 'text-primary',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'hidden px-4 sm:inline-flex')}>
            <LogIn className="rtl:rotate-180" aria-hidden="true" />
            {t.nav.login}
          </Link>

          <Sheet>
            <SheetTrigger
              className={cn(buttonVariants({ variant: 'outline', size: 'icon-lg' }), 'md:hidden')}
              aria-label={t.nav.openMenu}
            >
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'left' : 'right'} className="w-72 p-6">
              <SheetTitle className="sr-only">{t.nav.mainNavigation}</SheetTitle>
              <Logo />
              <nav aria-label={t.nav.mainNavigation} className="mt-4 flex flex-col gap-1">
                {[...links, { href: '/login', label: t.nav.login }].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <LanguageSwitcher className="mt-2 self-start" />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
