'use client'

import { PageHeader } from '@/components/common/page-header'
import { ShipmentReports } from '@/components/dashboard/shipment-reports'
import { useLanguage } from '@/contexts/language-context'

export function ReportsView() {
  const { t } = useLanguage()

  return (
    <>
      <PageHeader title={t.dashboard.reportsTitle} description={t.dashboard.reportsDescription} />
      <ShipmentReports />
    </>
  )
}
