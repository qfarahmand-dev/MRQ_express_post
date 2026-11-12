'use client'

import { PageHeader } from '@/components/common/page-header'
import { ShipmentForm } from '@/components/shipments/shipment-form'
import { ShipmentLoading, ShipmentNotFound } from '@/components/shipments/shipment-not-found'
import { useLanguage } from '@/contexts/language-context'
import { useShipment } from '@/hooks/use-shipments'
import { interpolate } from '@/lib/format'

export function EditShipmentView({ id }: { id: string }) {
  const { t } = useLanguage()
  const { data: shipment, error, isLoading } = useShipment(id)

  if (isLoading) return <ShipmentLoading />
  if (error) {
    return <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{t.common.unexpectedError}</p>
  }
  if (!shipment) return <ShipmentNotFound />

  return (
    <>
      <PageHeader
        title={t.shipments.editTitle}
        description={interpolate(t.shipments.editDescription, { number: shipment.trackingNumber || t.shipments.notAssigned })}
      />
      <ShipmentForm key={shipment.id} shipment={shipment} />
    </>
  )
}
