'use client'

import { MapPin } from 'lucide-react'
import { statusStyles } from '@/components/common/status-badge'
import { useLanguage } from '@/contexts/language-context'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ShipmentEvent } from '@/types/shipment'

export function ShipmentTimeline({ events }: { events: Pick<ShipmentEvent, 'id' | 'status' | 'location' | 'note' | 'createdAt'>[] }) {
  const { t, lang } = useLanguage()
  const ordered = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <ol className="flex flex-col">
      {ordered.map((event, index) => {
        const isLatest = index === 0
        const isLast = index === ordered.length - 1
        return (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && <span className="absolute start-[0.6875rem] top-6 h-[calc(100%-1.25rem)] w-px bg-border" aria-hidden="true" />}
            <span
              className={cn(
                'relative mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 bg-card',
                isLatest ? 'border-primary' : 'border-border',
              )}
              aria-hidden="true"
            >
              <span className={cn('size-2.5 rounded-full', isLatest ? statusStyles[event.status].dot : 'bg-muted-foreground/40')} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                <p className={cn('text-sm font-semibold', isLatest ? 'text-foreground' : 'text-foreground/80')}>
                  {t.statuses[event.status]}
                </p>
                <time dateTime={event.createdAt} className="text-xs text-muted-foreground">
                  {formatDateTime(event.createdAt, lang)}
                </time>
              </div>
              {event.location && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  <bdi>{event.location}</bdi>
                </p>
              )}
              {event.note && (
                <p dir="auto" className="text-sm text-muted-foreground text-pretty">
                  {event.note}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
