'use client'

import { CircleCheckBig, ClipboardList, Package, Truck } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useShipmentStats } from '@/hooks/use-shipments'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export function StatsCards() {
  const { t, lang } = useLanguage()
  const { data, error } = useShipmentStats()

  const cards = [
    { label: t.dashboard.stats.total, value: data?.total, icon: Package, tone: 'bg-primary text-highlight' },
    { label: t.dashboard.stats.registered, value: data?.registered, icon: ClipboardList, tone: 'bg-slate-100 text-slate-700' },
    {
      label: t.dashboard.stats.inTransit,
      value: data?.inTransit,
      icon: Truck,
      tone: 'bg-highlight/25 text-primary',
      hint: t.dashboard.stats.inTransitHint,
    },
    { label: t.dashboard.stats.delivered, value: data?.delivered, icon: CircleCheckBig, tone: 'bg-green-50 text-success' },
  ]

  return (
    <>
      {error && <p role="alert" className="text-sm text-destructive">{t.common.unexpectedError}</p>}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone, hint }) => (
        <li key={label} className="flex items-start justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {value === undefined ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-muted align-middle" aria-hidden="true" />
              ) : (
                formatNumber(value, lang)
              )}
            </p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', tone)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </li>
      ))}
      </ul>
    </>
  )
}
