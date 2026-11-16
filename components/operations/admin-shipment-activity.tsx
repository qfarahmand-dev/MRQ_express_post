'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRightLeft, RefreshCw, Warehouse } from 'lucide-react'
import { ManagementNotice } from '@/components/management/management-notice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/contexts/language-context'
import { officeOperationsService, shipmentTransfersService, warehouseService } from '@/services/warehouse-service'
import { formatDateTime } from '@/lib/format'

type ActivityView = 'transfers' | 'warehouse'

type RealTransfer = {
  id: string
  trackingNumber: string
  fromOffice: string
  toOffice: string
  state: 'in_transit' | 'received'
  createdAt: string
  note: string
}

type RealActivity = {
  id: string
  trackingNumber: string
  activity: string
  location: string
  createdAt: string
}

export function AdminShipmentActivity() {
  const { t, lang } = useLanguage()
  const [view, setView] = useState<ActivityView>('transfers')
  const [transfers, setTransfers] = useState<RealTransfer[]>([])
  const [activities, setActivities] = useState<RealActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [transferResult, activityResult] = await Promise.all([
        shipmentTransfersService.listTransfers(),
        warehouseService.listWarehouseOperations(),
      ])

      const mappedTransfers: RealTransfer[] = (transferResult || []).map((t: any) => ({
        id: t.id,
        trackingNumber: t.shipmentId,
        fromOffice: t.sourceOfficeId || '',
        toOffice: t.destinationOfficeId || '',
        state: t.state,
        createdAt: t.createdAt,
        note: t.note || '',
      }))
      setTransfers(mappedTransfers)

      const mappedActivities: RealActivity[] = (activityResult || []).map((a: any) => ({
        id: a.id,
        trackingNumber: a.shipmentId,
        activity: a.operationType,
        location: a.location || '',
        createdAt: a.createdAt,
      }))
      setActivities(mappedActivities)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.operations.adminOperationsTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.operations.adminOperationsDescription}</p>
        </div>
        <ManagementNotice>{t.operations.demoNotice}</ManagementNotice>
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="size-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.operations.adminOperationsTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.operations.adminOperationsDescription}</p>
        </div>
        <ManagementNotice>{t.operations.demoNotice}</ManagementNotice>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </section>
    )
  }

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
              {view === 'transfers' ? transfers.map((transfer) => (
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
              )) : activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell dir="ltr" className="font-mono font-medium">{activity.trackingNumber}</TableCell>
                  <TableCell>{activity.activity}</TableCell>
                  <TableCell>{activity.location}</TableCell>
                  <TableCell>{formatDateTime(activity.createdAt, lang)}</TableCell>
                </TableRow>
              ))}
              {(view === 'transfers' && transfers.length === 0) || (view === 'warehouse' && activities.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={view === 'transfers' ? 5 : 4} className="py-12 text-center text-sm text-muted-foreground">
                    {t.operations.noActivity}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
