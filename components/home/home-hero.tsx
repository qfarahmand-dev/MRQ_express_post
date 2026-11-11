'use client'

import Image from 'next/image'
import { Globe2, ShieldCheck, Timer } from 'lucide-react'
import { TrackingSearchForm } from '@/components/tracking/tracking-search-form'
import { useLanguage } from '@/contexts/language-context'
import { interpolate } from '@/lib/format'

export function HomeHero() {
  const { t } = useLanguage()
  const icons = [ShieldCheck, Globe2, Timer]

  return (
    <>
      <section className="relative overflow-hidden bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 self-start rounded-full border bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-highlight" aria-hidden="true" />
              {t.home.eyebrow}
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-primary text-balance sm:text-5xl">
              {t.home.title}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">{t.home.description}</p>
            <div className="flex flex-col gap-2">
              <TrackingSearchForm size="large" />
              <p className="text-xs text-muted-foreground">
                {interpolate(t.home.trackHint, { example: 'MRQ240001846' })}
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 -z-0 rounded-3xl bg-highlight/30 rotate-2" aria-hidden="true" />
            <Image
              src="/images/hero-cargo.png"
              alt={t.home.imageAlt}
              width={1200}
              height={900}
              priority
              className="relative aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-16 border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:py-20">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl text-balance">{t.home.aboutTitle}</h2>
            <p className="text-muted-foreground text-pretty">{t.home.aboutDescription}</p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {t.home.features.map((feature, index) => {
              const Icon = icons[index]
              return (
                <li key={feature.title} className="flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-highlight">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
