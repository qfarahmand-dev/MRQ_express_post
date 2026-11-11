'use client'

import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from '@/components/common/logo'
import { useLanguage } from '@/contexts/language-context'

export function SiteFooter() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  const contacts = [
    { icon: MapPin, value: t.footer.address },
    { icon: Phone, value: t.footer.phone, href: `tel:${t.footer.phone.replace(/\s/g, '')}`, ltr: true },
    { icon: Mail, value: t.footer.email, href: `mailto:${t.footer.email}`, ltr: true },
    { icon: Clock, value: t.footer.hours },
  ]

  return (
    <footer id="contact" className="scroll-mt-16 bg-primary text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Logo variant="light" className="self-start" />
          <p className="max-w-sm text-sm leading-relaxed text-white/70">{t.footer.description}</p>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-highlight">{t.footer.contactTitle}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
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
