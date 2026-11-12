'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { useLanguage } from '@/contexts/language-context'
import Link from 'next/link'

export function SiteFooter() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  const contacts = [
    { icon: MapPin, value: t.footer.address },
    { icon: MapPin, value: t.footer.branch },
    { icon: Phone, value: t.footer.phone, href: `tel:${t.footer.phone.replace(/\s/g, '')}`, ltr: true },
    { icon: Mail, value: t.footer.email, href: `mailto:${t.footer.email}`, ltr: true },
  ]
  const links = [
    { href: '/#home', label: t.nav.home },
    { href: '/#about', label: t.nav.about },
    { href: '/#services', label: t.nav.services },
    { href: '/#history', label: t.nav.history },
    { href: '/#team', label: t.nav.team },
    { href: '/#contact', label: t.nav.contact },
  ]

  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Logo variant="light" className="self-start" />
          <p className="max-w-sm text-sm leading-relaxed text-white/70">{t.footer.description}</p>
          <a href="/login" className="self-start text-sm font-semibold text-highlight hover:underline">
            {t.nav.login}
          </a>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-highlight">{t.footer.linksTitle}</h2>
          <nav aria-label={t.nav.mainNavigation}>
            <ul className="grid grid-cols-2 gap-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/75 transition hover:text-highlight">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-highlight">{t.footer.contactTitle}</h2>
          <ul className="grid gap-3">
            {contacts.map(({ icon: Icon, value, href, ltr }) => (
              <li key={value} className="flex items-start gap-2.5 text-sm text-white/85">
                <Icon className="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden="true" />
                {href ? (
                  <a href={href} dir={ltr ? 'ltr' : undefined} className="hover:text-white hover:underline">
                    {value}
                  </a>
                ) : (
                  <span>{value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/60 sm:px-6">
          © {year} MRQ Express Post. {t.footer.rights}
        </p>
      </div>
    </footer>
  )
}
