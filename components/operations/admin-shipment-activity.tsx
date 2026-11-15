'use client'

import { useState } from 'react'
import { ArrowRightLeft, Warehouse } from 'lucide-react'
import { ManagementNotice } from '@/components/management/management-notice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/contexts/language-context'
import { demoOperationalTransfers, demoWarehouseActivities } from '@/data/demo-shipment-operations'
import { formatDateTime } from '@/lib/format'

type ActivityView = 'transfers' | 'warehouse'

export function AdminShipmentActivity() {
  const { t, lang } = useLanguage()
  const [view, setView] = useState<ActivityView>('transfers')

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t.operations.adminOperationsTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.operations.adminOperationsDescription}</p>
      </div>
      <ManagementNotice>{t.operations.demoNotice}</ManagementNotice>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{view === 'transfers' ? t.operations.transferHistory : t.operations.warehouseActivities}</CardTitle>
          <div className="flex gap-2" role="group" aria-label={t.operations.adminOperationsTitle}>
            <Button variant={view === 'transfers' ? 'default' : 'outline'} size="sm" aria-pressed={view === 'transfers'} onClick={() => setView('transfers')}>
              <ArrowRightLeft aria-hidden="true" />
              {t.operations.transfers}
            </Button>
            <Button variant={view === 'warehouse' ? 'default' : 'outline'} size="sm" aria-pressed={view === 'warehouse'} onClick={() => setView('warehouse')}>
              <Warehouse aria-hidden="true" />
              {t.operations.warehouseActivities}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead>{t.operations.trackingNumber}</TableHead>
                {view === 'transfers' ? (
                  <>
                    <TableHead>{t.operations.sourceOffice}</TableHead>
                    <TableHead>{t.operations.destinationOffice}</TableHead>
                    <TableHead>{t.operations.status}</TableHead>
                    <TableHead>{t.operations.dateTime}</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>{t.operations.activity}</TableHead>
                    <TableHead>{t.operations.location}</TableHead>
                    <TableHead>{t.operations.dateTime}</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {view === 'transfers' ? demoOperationalTransfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell dir="ltr" className="font-mono font-medium">{transfer.trackingNumber}</TableCell>
                  <TableCell>{transfer.fromOffice}</TableCell>
                  <TableCell>{transfer.toOffice}</TableCell>
                  <TableCell>
                    <span className={transfer.state === 'received'
                      ? 'inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700'
                      : 'inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'}>
                      {transfer.state === 'received' ? t.operations.transferReceived : t.operations.transferInTransit}
                    </span>
                  </TableCell>
                  <TableCell>{formatDateTime(transfer.createdAt, lang)}</TableCell>
                </TableRow>
              )) : demoWarehouseActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell dir="ltr" className="font-mono font-medium">{activity.trackingNumber}</TableCell>
                  <TableCell>{activity.activity}</TableCell>
                  <TableCell>{activity.location}</TableCell>
                  <TableCell>{formatDateTime(activity.createdAt, lang)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
