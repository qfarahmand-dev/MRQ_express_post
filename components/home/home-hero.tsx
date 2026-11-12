'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  Clock3,
  FileCheck2,
  Globe2,
  Headset,
  MapPin,
  Package,
  PackageCheck,
  Plane,
  ShieldCheck,
  Ship,
  Target,
  Timer,
  TrainFront,
  Truck,
  UsersRound,
} from 'lucide-react'
import { TrackingSearchForm } from '@/components/tracking/tracking-search-form'
import { useLanguage } from '@/contexts/language-context'
import { interpolate } from '@/lib/format'

function AnimatedStat({
  value,
  label,
  suffix,
  compact,
  lang,
}: {
  value: number
  label: string
  suffix: string
  compact?: boolean
  lang: 'en' | 'fa'
}) {
  const [visible, setVisible] = useState(false)
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return

    const startedAt = performance.now()
    let frame = 0
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / 1100, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [value, visible])

  const number =
    compact && count >= 1000
      ? `${(count / 1000).toLocaleString(lang === 'fa' ? 'fa-AF' : 'en-US', { maximumFractionDigits: 1 })}${lang === 'fa' ? ' هزار' : 'K'}`
      : count.toLocaleString(lang === 'fa' ? 'fa-AF' : 'en-US')

  return (
    <div ref={ref} className="flex flex-col gap-1">
      <span className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl" aria-label={`${value}${suffix}`}>
        {number}
        {suffix}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

export function HomeHero() {
  const { t, lang } = useLanguage()
  const c = t.company
  const serviceIcons = [Plane, Package, Ship, Truck, TrainFront, Boxes, FileCheck2]
  const advantageIcons = [Timer, Globe2, Headset]
  const statValues = [new Date().getFullYear() - 2013, 20, 1500, 40]
  const statSuffixes = [lang === 'fa' ? '+' : '+', '+', '+', '%']

  return (
    <>
      <section id="home" className="relative scroll-mt-24 overflow-hidden bg-card">
        <div className="pointer-events-none absolute -left-36 -top-32 size-72 rounded-full bg-highlight/10 blur-3xl sm:size-[30rem]" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div className="relative z-10 flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-primary/10 bg-secondary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary">
              <span className="size-2 rounded-full bg-highlight" aria-hidden="true" />
              {c.heroKicker}
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.13] tracking-tight text-primary text-balance sm:text-5xl lg:text-6xl">
              {t.home.title}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">{t.home.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#services"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {c.exploreServices}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </a>
              <a
                href="#about"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-primary transition hover:bg-secondary"
              >
                {c.learnAbout}
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <TrackingSearchForm size="large" />
              <p className="text-xs text-muted-foreground">
                {interpolate(t.home.trackHint, { example: 'MRQ240001846' })}
              </p>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-3 rounded-[2rem] bg-highlight/80 rotate-2" aria-hidden="true" />
            <Image
              src="/images/hero-cargo.png"
              alt={t.home.imageAlt}
              width={1200}
              height={900}
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="relative aspect-[4/3] w-full rounded-[1.7rem] object-cover shadow-xl"
            />
            <div className="absolute -bottom-5 -left-3 max-w-[16rem] rounded-2xl border bg-card p-4 shadow-xl sm:-left-7 sm:p-5">
              <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-highlight">
                <Globe2 className="size-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold text-primary">{c.heroProofTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.heroProofText}</p>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 md:pb-14">
          <div className="grid gap-6 rounded-2xl border bg-background p-6 shadow-sm sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
            {c.stats.map((stat, index) => (
              <AnimatedStat
                key={stat.label}
                value={statValues[index]}
                label={stat.label}
                suffix={statSuffixes[index]}
                compact={index === 2}
                lang={lang}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 border-t bg-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary/70">{c.aboutEyebrow}</span>
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-primary text-balance sm:text-4xl">{c.aboutTitle}</h2>
            <p className="max-w-2xl leading-7 text-muted-foreground text-pretty">{c.aboutDescription}</p>
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-highlight/20 text-primary">
                <Globe2 className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold leading-relaxed text-foreground">{c.networkNote}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl bg-primary p-6 text-white shadow-sm sm:col-span-2 sm:p-8">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-highlight text-primary">
                <Target className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold">{c.visionTitle}</h3>
              <p className="mt-2 leading-relaxed text-white/75">{c.visionText}</p>
            </article>
            <article className="rounded-2xl border bg-card p-6 shadow-sm sm:col-span-2 sm:p-8">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <BadgeCheck className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-primary">{c.missionTitle}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{c.missionText}</p>
            </article>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary/70">{c.servicesEyebrow}</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-primary text-balance sm:text-4xl">{c.servicesTitle}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{c.servicesDescription}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.services.map((service, index) => {
              const Icon = serviceIcons[index]
              return (
                <li key={service.title} className="group rounded-2xl border bg-background p-6 transition hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg">
                  <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary text-highlight transition group-hover:bg-highlight group-hover:text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-bold text-primary">{service.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section className="border-t bg-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-highlight">{c.advantagesEyebrow}</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{c.advantagesTitle}</h2>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {c.advantages.map((advantage, index) => {
              const Icon = advantageIcons[index]
              return (
                <li key={advantage.title} className="rounded-2xl border border-white/15 bg-white/5 p-6">
                  <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-highlight text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-bold">{advantage.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{advantage.description}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section id="history" className="scroll-mt-24 border-t bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="mb-10 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary/70">{c.historyEyebrow}</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-primary text-balance sm:text-4xl">{c.historyTitle}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{c.historyDescription}</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.timeline.map((item) => (
              <li key={item.year} className="relative rounded-2xl border bg-card p-6">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-extrabold text-primary">
                  <Clock3 className="size-4" aria-hidden="true" />
                  {item.year}
                </span>
                <h3 className="font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="team" className="scroll-mt-24 border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary/70">{c.teamEyebrow}</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-primary text-balance sm:text-4xl">{c.teamTitle}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{c.teamDescription}</p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.teamMembers.map((member, index) => (
              <li key={member.name} className="overflow-hidden rounded-2xl border bg-background shadow-sm">
                <div className={`flex aspect-[4/3] items-center justify-center ${index === 1 ? 'bg-secondary' : 'bg-primary'}`}>
                  <div className={`flex size-28 items-center justify-center rounded-full border-4 ${index === 1 ? 'border-primary/15 bg-card text-primary' : 'border-white/20 bg-white/10 text-highlight'}`}>
                    <UsersRound className="size-12" aria-hidden="true" />
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-primary">{member.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 border-t bg-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary/70">{c.contactEyebrow}</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-primary text-balance sm:text-4xl">{c.contactTitle}</h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{c.contactDescription}</p>
            <a
              href={`mailto:${t.footer.email}`}
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {c.contactCta}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: MapPin, label: c.addressLabel, value: t.footer.address },
              { icon: Building2, label: c.branchLabel, value: t.footer.branch },
              { icon: UsersRound, label: c.phoneLabel, value: t.footer.phone, href: `tel:${t.footer.phone.replace(/\s/g, '')}` },
              { icon: PackageCheck, label: c.emailLabel, value: t.footer.email, href: `mailto:${t.footer.email}` },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="rounded-2xl border bg-card p-5">
                <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
                {href ? (
                  <a href={href} dir={label === c.emailLabel || label === c.phoneLabel ? 'ltr' : undefined} className="mt-1 inline-block max-w-full break-all font-bold text-primary hover:underline">
                    {value}
                  </a>
                ) : (
                  <p className="mt-1 font-bold text-primary">{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
