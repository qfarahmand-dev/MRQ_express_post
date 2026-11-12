'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Package, Pencil, Phone, Trash2, UserRound, UserRoundCheck, type LucideIcon } from 'lucide-react'
import { StatusBadge } from '@/components/common/status-badge'
import { DeleteShipmentDialog } from '@/components/shipments/delete-shipment-dialog'
import { ShipmentLoading, ShipmentNotFound } from '@/components/shipments/shipment-not-found'
import { StatusUpdateForm } from '@/components/shipments/status-update-form'
import { ShipmentTimeline } from '@/components/tracking/shipment-timeline'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useShipment } from '@/hooks/use-shipments'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { shipmentService } from '@/services/shipment-service'
import type { PartyInfo } from '@/types/shipment'

function PartyCard({ icon: Icon, title, party }: { icon: LucideIcon; title: string; party: PartyInfo }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {title}
      </div>
      <p className="font-semibold text-foreground">{party.name}</p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Phone className="size-4 shrink-0" aria-hidden="true" />
        <a href={`tel:${party.phone.replace(/\s/g, '')}`} dir="ltr" className="hover:text-primary hover:underline">
          {party.phone}
        </a>
      </p>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {party.address}
      </p>
    </div>
  )
}

function PrivatePhotoLink({ path }: { path: string | null }) {
  const { t } = useLanguage()
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setUrl(null)
    setFailed(false)
    if (path) {
      shipmentService.getPrivatePhotoUrl(path).then((value) => {
        if (active) setUrl(value)
      }).catch(() => {
        if (active) setFailed(true)
      })
    }
    return () => { active = false }
  }, [path])

  if (!path) return <p className="text-sm text-muted-foreground">{t.shipments.noPhoto}</p>
  if (failed) return <p role="alert" className="text-sm text-destructive">{t.details.photoUnavailable}</p>
  if (!url) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline underline-offset-4">
      {t.details.viewPrivatePhoto}
    </a>
  )
}

export function ShipmentDetails({ id }: { id: string }) {
  const { t, lang } = useLanguage()
  const { can } = useAuth()
  const router = useRouter()
  const { data: shipment, error, isLoading } = useShipment(id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading) return <ShipmentLoading />
  if (error) {
    return <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{t.common.unexpectedError}</p>
  }
  if (!shipment) return <ShipmentNotFound />

  const facts = [
    { label: t.track.packageType, value: t.packageTypes[shipment.packageType] },
    { label: t.details.weight, value: shipment.weightKg > 0 ? `${formatNumber(shipment.weightKg, lang)} kg` : t.shipments.notAssigned },
    {
      label: t.details.dimensions,
      value: [shipment.dimensionsCm.length, shipment.dimensionsCm.width, shipment.dimensionsCm.height].some((value) => value !== null)
        ? `${shipment.dimensionsCm.length ?? '—'} × ${shipment.dimensionsCm.width ?? '—'} × ${shipment.dimensionsCm.height ?? '—'}`
        : t.shipments.notAssigned,
    },
    { label: t.details.carrier, value: shipment.shippingCompany ?? t.shipments.notAssigned },
    { label: t.track.registrationDate, value: formatDate(shipment.registrationDate, lang) },
    { label: t.details.receivedDate, value: shipment.receivedDate ? formatDate(shipment.receivedDate, lang) : t.shipments.notAssigned },
    { label: t.details.createdAt, value: formatDateTime(shipment.createdAt, lang) },
    { label: t.details.updatedAt, value: formatDateTime(shipment.updatedAt, lang) },
  ]

  return (
    <>
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/shipments"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t.shipments.backToList}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 dir="ltr" className="font-mono text-2xl font-bold tracking-tight text-primary">
              {shipment.trackingNumber || t.form.noTrackingNumber}
            </h1>
            <StatusBadge status={shipment.status} className="px-3 py-1 text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/shipments/${shipment.id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-4')}>
              <Pencil aria-hidden="true" />
              {t.common.edit}
            </Link>
            {can('delete') ? (
              <Button variant="destructive" size="lg" className="px-4" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden="true" />
                {t.common.delete}
              </Button>
            ) : (
              <p className="self-center text-xs text-muted-foreground">{t.details.deleteAdminOnly}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.details.shipmentInfo}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <PartyCard icon={UserRound} title={t.details.sender} party={shipment.sender} />
                <PartyCard icon={UserRoundCheck} title={t.details.receiver} party={shipment.receiver} />
              </div>
              <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.details.senderIdPhoto}</p>
                  <PrivatePhotoLink path={shipment.senderIdPhotoPath} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.details.receiverHomePhoto}</p>
                  <PrivatePhotoLink path={shipment.receiverHomePhotoPath} />
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Package className="size-4 text-primary" aria-hidden="true" />
                  {t.details.package}
                </div>
                <p className="text-sm text-foreground text-pretty">{shipment.description || t.details.noDescription}</p>
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {facts.map((fact) => (
                    <div key={fact.label} className="flex flex-col gap-0.5">
                      <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                      <dd className="text-sm font-medium text-foreground">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.details.timeline}</CardTitle>
            </CardHeader>
            <CardContent>
              <ShipmentTimeline events={shipment.events} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {can('updateStatus') && <StatusUpdateForm key={shipment.status} shipment={shipment} />}
        </div>
      </div>

      <DeleteShipmentDialog
        shipment={confirmDelete ? shipment : null}
        onOpenChange={setConfirmDelete}
        onDeleted={() => router.push('/dashboard/shipments')}
      />
    </>
  )
}
