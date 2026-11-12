'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn, Mail, Menu, Phone } from 'lucide-react'
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
    { href: '/#home', label: t.nav.home },
    { href: '/#about', label: t.nav.about },
    { href: '/#services', label: t.nav.services },
    { href: '/#history', label: t.nav.history },
    { href: '/#team', label: t.nav.team },
    { href: '/#contact', label: t.nav.contact },
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="hidden border-b bg-primary text-white sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6">
          <span className="text-white/75">{t.brand.tagline}</span>
          <div className="flex items-center gap-5">
            <a href={`mailto:${t.footer.email}`} dir="ltr" className="inline-flex items-center gap-2 text-white/85 hover:text-highlight">
              <Mail className="size-3.5 text-highlight" aria-hidden="true" />
              {t.footer.email}
            </a>
            <a href={`tel:${t.footer.phone.replace(/\s/g, '')}`} dir="ltr" className="inline-flex items-center gap-2 text-white/85 hover:text-highlight">
              <Phone className="size-3.5 text-highlight" aria-hidden="true" />
              {t.footer.phone}
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label={t.nav.mainNavigation} className="hidden items-center gap-0.5 xl:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === '/' && link.href === '/#home' ? 'page' : undefined}
              className={cn(
                'rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary',
                pathname === '/' && link.href === '/#home' && 'text-primary',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link href="/track" className="hidden rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-primary lg:inline-flex">
            {t.nav.track}
          </Link>
          <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'hidden px-4 sm:inline-flex')}>
            <LogIn className="rtl:rotate-180" aria-hidden="true" />
            {t.nav.login}
          </Link>

          <Sheet>
            <SheetTrigger
              className={cn(buttonVariants({ variant: 'outline', size: 'icon-lg' }), 'xl:hidden')}
              aria-label={t.nav.openMenu}
            >
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side={dir === 'rtl' ? 'left' : 'right'} className="w-80 max-w-[90vw] p-6">
              <SheetTitle className="sr-only">{t.nav.mainNavigation}</SheetTitle>
              <Logo />
              <nav aria-label={t.nav.mainNavigation} className="mt-5 flex flex-col gap-1">
                {[...links, { href: '/track', label: t.nav.track }, { href: '/login', label: t.nav.login }].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <LanguageSwitcher className="mt-3 self-start" />
              <div className="mt-6 border-t pt-5 text-sm text-muted-foreground">
                <a href={`mailto:${t.footer.email}`} dir="ltr" className="mb-3 flex items-center gap-2 hover:text-primary">
                  <Mail className="size-4" aria-hidden="true" />
                  {t.footer.email}
                </a>
                <a href={`tel:${t.footer.phone.replace(/\s/g, '')}`} dir="ltr" className="flex items-center gap-2 hover:text-primary">
                  <Phone className="size-4" aria-hidden="true" />
                  {t.footer.phone}
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
