'use client'

import { TrackingResult } from '@/components/tracking/tracking-result'
import { TrackingSearchForm } from '@/components/tracking/tracking-search-form'
import { CarrierTrackingLinks } from '@/components/tracking/carrier-tracking-links'
import { useLanguage } from '@/contexts/language-context'
import { interpolate } from '@/lib/format'

export function TrackView({ number, resultPath = '/track', includeCarrierTracking = false }: { number: string; resultPath?: string; includeCarrierTracking?: boolean }) {
  const { t } = useLanguage()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-primary text-balance">{t.track.title}</h1>
        <p className="max-w-2xl text-muted-foreground text-pretty">{t.track.description}</p>
      </div>
      <TrackingSearchForm key={number} defaultValue={number} className="max-w-2xl" resultPath={resultPath} />
      {number ? (
        <TrackingResult number={number} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {interpolate(t.home.trackHint, { example: 'MRQ240001846' })}
        </p>
      )}
      {includeCarrierTracking && <CarrierTrackingLinks />}
    </div>
  )
}
