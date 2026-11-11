'use client'

import { PageHeader } from '@/components/common/page-header'
import { ShipmentForm } from '@/components/shipments/shipment-form'
import { useLanguage } from '@/contexts/language-context'

export function NewShipmentView() {
  const { t } = useLanguage()
  return (
    <>
      <PageHeader title={t.shipments.newTitle} description={t.shipments.newDescription} />
      <ShipmentForm />
    </>
  )
}
