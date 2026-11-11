'use client'

import useSWR from 'swr'
import { Loader2, PackageX, ShieldCheck } from 'lucide-react'
import { StatusBadge } from '@/components/common/status-badge'
import { ShipmentTimeline } from '@/components/tracking/shipment-timeline'
import { useLanguage } from '@/contexts/language-context'
import { formatDate, formatDateTime, interpolate } from '@/lib/format'
import { shipmentService } from '@/services/shipment-service'

export function TrackingResult({ number }: { number: string }) {
  const { t, lang } = useLanguage()
  const { data, isLoading } = useSWR(['track', number], () => shipmentService.trackPublic(number))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border bg-card p-10 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t.common.loading}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center" role="alert">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <PackageX className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold">{t.track.notFoundTitle}</h2>
        <p className="max-w-md text-sm text-muted-foreground text-pretty">
          {interpolate(t.track.notFoundDescription, { number })}
        </p>
      </div>
    )
  }

  const latest = data.events.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))

  const facts = [
    { label: t.track.sender, value: data.senderName },
    { label: t.track.receiver, value: data.receiverName },
    { label: t.track.packageType, value: t.packageTypes[data.packageType] },
    { label: t.track.registrationDate, value: formatDate(data.registrationDate, lang) },
    { label: t.track.latestUpdate, value: formatDateTime(data.updatedAt, lang) },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm lg:col-span-2" aria-labelledby="tracking-summary">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.track.trackingNumber}</p>
          <h2 id="tracking-summary" dir="ltr" className="font-mono text-xl font-bold text-primary rtl:text-end">
            {data.trackingNumber}
          </h2>
        </div>
        <div className="flex flex-col gap-2 rounded-lg bg-muted p-4">
          <p className="text-xs font-medium text-muted-foreground">{t.track.currentStatus}</p>
          <StatusBadge status={data.status} className="self-start px-3 py-1 text-sm" />
          {latest.location && (
            <p className="text-sm text-muted-foreground">
              <bdi>{latest.location}</bdi>
            </p>
          )}
        </div>
        <dl className="flex flex-col divide-y">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{fact.label}</dt>
              <dd className="font-medium text-foreground text-end">
                <bdi>{fact.value}</bdi>
              </dd>
            </div>
          ))}
        </dl>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          {t.track.privacyNote}
        </p>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-3" aria-labelledby="tracking-progress">
        <h2 id="tracking-progress" className="mb-5 text-base font-semibold">
          {t.track.progress}
        </h2>
        <ShipmentTimeline events={data.events} />
      </section>
    </div>
  )
}
