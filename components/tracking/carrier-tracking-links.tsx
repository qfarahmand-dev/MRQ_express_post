'use client'

import { useState } from 'react'
import { ExternalLink, Truck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/language-context'
import { normalizeTrackingNumber, TRACKING_NUMBER_MAX_LENGTH } from '@/lib/validation'

const carriers = [
  {
    name: 'UPS',
    key: 'ups',
    url: (number: string) => `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(number)}`,
  },
  {
    name: 'DHL',
    key: 'dhl',
    url: (number: string) => `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(number)}`,
  },
] as const

function CarrierForm({ carrier }: { carrier: (typeof carriers)[number] }) {
  const { t } = useLanguage()
  const [number, setNumber] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trackingNumber = normalizeTrackingNumber(number)
    if (!/^[A-Z0-9]{1,25}$/.test(trackingNumber)) {
      setError(true)
      return
    }

    setError(false)
    window.open(carrier.url(trackingNumber), '_blank', 'noopener,noreferrer')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <label htmlFor={`carrier-${carrier.key}`} className="text-sm font-medium">{t.track.trackingNumber}</label>
      <Input
        id={`carrier-${carrier.key}`}
        dir="ltr"
        value={number}
        onChange={(event) => {
          setNumber(event.target.value)
          setError(false)
        }}
        maxLength={TRACKING_NUMBER_MAX_LENGTH}
        autoComplete="off"
        spellCheck={false}
        placeholder="1Z999AA10123456784"
        aria-invalid={error || undefined}
        aria-describedby={error ? `carrier-${carrier.key}-error` : undefined}
      />
      {error && <p id={`carrier-${carrier.key}-error`} role="alert" className="text-sm text-destructive">{t.form.errors.trackingFormat}</p>}
      <Button type="submit" className="self-start">
        <ExternalLink aria-hidden="true" />
        {carrier.key === 'ups' ? t.track.trackWithUps : t.track.trackWithDhl}
      </Button>
    </form>
  )
}

export function CarrierTrackingLinks() {
  const { t } = useLanguage()
  return (
    <section className="flex flex-col gap-4" aria-labelledby="carrier-tracking-title">
      <div>
        <h2 id="carrier-tracking-title" className="flex items-center gap-2 text-xl font-semibold">
          <Truck className="size-5 text-primary" aria-hidden="true" />
          {t.track.carrierTracking}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.track.carrierTrackingDescription}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t.track.carrierNumberHint}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {carriers.map((carrier) => (
          <Card key={carrier.key}>
            <CardHeader>
              <CardTitle>{carrier.name}</CardTitle>
              <CardDescription>{t.track.carrier}</CardDescription>
            </CardHeader>
            <CardContent>
              <CarrierForm carrier={carrier} />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
