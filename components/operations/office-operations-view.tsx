'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, CircleAlert, RefreshCw, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { ManagementNotice } from '@/components/management/management-notice'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import {
  subscribeToShipmentChanges,
  subscribeToNotifications,
} from '@/lib/realtime'
import {
  officeOperationsService,
  shipmentIssuesService,
  shipmentOpsService,
} from '@/services/warehouse-service'
import { formatDateTime } from '@/lib/format'
import { normalizeTrackingNumber } from '@/lib/validation'
import { SHIPMENT_STATUSES, type ShipmentStatus } from '@/types/shipment'

export type OfficeOperationsMode = 'shipments' | 'incoming' | 'outgoing' | 'warehouse-monitoring' | 'approvals' | 'issues'

const fieldClass = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function isShipmentStatus(value: string): value is ShipmentStatus {
  return SHIPMENT_STATUSES.some((status) => status === value)
}

const headingByMode: Record<OfficeOperationsMode, keyof import('@/lib/i18n').Dictionary['operations']> = {
  shipments: 'officeShipmentsTitle',
  incoming: 'incomingTitle',
  outgoing: 'outgoingTitle',
  'warehouse-monitoring': 'warehouseMonitoringTitle',
  approvals: 'approvalsTitle',
  issues: 'officeIssuesTitle',
}

const descriptionByMode: Record<OfficeOperationsMode, keyof import('@/lib/i18n').Dictionary['operations']> = {
  shipments: 'officeShipmentsDescription',
  incoming: 'incomingDescription',
  outgoing: 'outgoingDescription',
  'warehouse-monitoring': 'warehouseMonitoringDescription',
  approvals: 'approvalsDescription',
  issues: 'officeIssuesDescription',
}

type RealShipment = {
  id: string
  trackingNumber: string | null
  flow: 'incoming' | 'outgoing'
  status: string
  destination: string
  recipient: string
  location: string
  updatedAt: string
  notes: string
  approval: 'pending' | 'approved' | 'rejected' | 'none'
}

type RealIssue = {
  id: string
  trackingNumber: string
  officeId: string
  kind: 'damaged' | 'missing' | 'delay'
  description: string
  state: 'open' | 'resolved'
  createdAt: string
}

type RealActivity = {
  id: string
  trackingNumber: string
  officeId: string
  activity: string
  location: string
  createdAt: string
}

export function OfficeOperationsView({ mode }: { mode: OfficeOperationsMode }) {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const officeId = user?.officeId

  const [shipments, setShipments] = useState<RealShipment[]>([])
  const [issues, setIssues] = useState<RealIssue[]>([])
  const [activities, setActivities] = useState<RealActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all')
  const [newIssueTracking, setNewIssueTracking] = useState('')
  const [newIssueKind, setNewIssueKind] = useState<'damaged' | 'missing' | 'delay'>('damaged')
  const [newIssueDescription, setNewIssueDescription] = useState('')

  const loadData = useCallback(async () => {
    if (!officeId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      const [shipmentResult, issueResult, activityResult] = await Promise.all([
        shipmentOpsService.listShipments(officeId),
        shipmentIssuesService.listIssues(officeId),
        officeOperationsService.listOfficeOperations(officeId),
      ])

      const modeStatus = mode === 'incoming' ? 'registered' : mode === 'outgoing' ? 'registered' : undefined

      const mappedShipments: RealShipment[] = shipmentResult.map((s) => {
        const flow = mode === 'incoming' || mode === 'outgoing' ? mode : 'outgoing'
        return {
          id: s.id,
          trackingNumber: s.trackingNumber,
          flow,
          status: s.status,
          destination: s.destinationCountry,
          recipient: s.receiverName,
          location: s.destinationCountry,
          updatedAt: s.updatedAt,
          notes: '',
          approval: 'none',
        }
      })

      const filteredShipments = modeStatus
        ? mappedShipments.filter((s) => s.status === modeStatus)
        : mappedShipments

      setShipments(filteredShipments)

      const mappedIssues: RealIssue[] = issueResult.map((i) => ({
        id: i.id,
        trackingNumber: i.shipmentId,
        officeId: i.officeId,
        kind: i.kind,
        description: i.description,
        state: i.state,
        createdAt: i.createdAt,
      }))
      setIssues(mappedIssues)

      const mappedActivities: RealActivity[] = activityResult.map((a) => ({
        id: a.id,
        trackingNumber: a.shipmentId || '',
        officeId: a.officeId,
        activity: a.operationType,
        location: a.notes || '',
        createdAt: a.createdAt,
      }))
      setActivities(mappedActivities)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      toast.error(t.common.unexpectedError || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [officeId, mode, t])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!officeId) return

    const unsubscribeShipments = subscribeToShipmentChanges(officeId, () => {
      loadData()
    })
    const unsubscribeNotifications = subscribeToNotifications(() => {
      loadData()
    })

    return () => {
      unsubscribeShipments()
      unsubscribeNotifications()
    }
  }, [officeId, loadData])

  const visibleShipments = useMemo(() => {
    const text = query.trim().toLocaleLowerCase()
    return shipments.filter((shipment) => {
      if (mode === 'incoming' && shipment.status !== 'registered') return false
      if (mode === 'outgoing' && shipment.status !== 'registered') return false
      if (mode === 'approvals' && shipment.approval !== 'pending') return false
      if (statusFilter !== 'all' && shipment.status !== statusFilter) return false
      if (text && !`${shipment.trackingNumber} ${shipment.destination} ${shipment.recipient}`.toLocaleLowerCase().includes(text)) return false
      return true
    })
  }, [shipments, mode, statusFilter, query])

  async function decide(shipmentId: string, approval: 'approved' | 'rejected') {
    setShipments((current) => current.map((shipment) => shipment.id === shipmentId ? { ...shipment, approval } : shipment))
    toast.info(t.operations.previewChangeNotice || 'Operation recorded')
  }

  async function reportIssue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!officeId || !newIssueTracking.trim() || !newIssueDescription.trim()) return

    const shipment = await shipmentOpsService.getShipmentByTrackingNumber(newIssueTracking)
    if (!shipment) {
      toast.error('Shipment not found')
      return
    }

    try {
      await shipmentIssuesService.reportIssue(shipment.id, officeId, newIssueKind, newIssueDescription)
      await loadData()
      setNewIssueTracking('')
      setNewIssueDescription('')
      toast.success('Issue reported')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to report issue')
    }
  }

  async function resolveIssue(issueId: string) {
    const issue = issues.find((i) => i.id === issueId)
    if (!issue || !officeId) return

    try {
      await shipmentIssuesService.resolveIssue(issueId, officeId)
      await loadData()
      toast.success('Issue resolved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve issue')
    }
  }

  if (!officeId) {
    return (
      <>
        <PageHeader title={t.operations[headingByMode[mode]]} description={t.operations[descriptionByMode[mode]]} />
        <ManagementNotice>{t.operations.officeAssignmentMissing}</ManagementNotice>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <PageHeader title={t.operations[headingByMode[mode]]} description={t.operations[descriptionByMode[mode]]} />
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="size-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <PageHeader title={t.operations[headingByMode[mode]]} description={t.operations[descriptionByMode[mode]]} />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t.operations[headingByMode[mode]]} description={t.operations[descriptionByMode[mode]]} />
      <ManagementNotice>{t.operations.demoNotice}</ManagementNotice>

      {mode === 'issues' && (
        <Card>
          <CardContent>
            <form onSubmit={reportIssue} className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t.operations.trackingNumber}
                <Input dir="ltr" value={newIssueTracking} onChange={(event) => setNewIssueTracking(event.target.value)} required />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t.operations.issueType}
                <select value={newIssueKind} onChange={(event) => {
                  if (event.target.value === 'damaged' || event.target.value === 'missing' || event.target.value === 'delay') setNewIssueKind(event.target.value)
                }} className={fieldClass}>
                  <option value="damaged">{t.operations.damaged}</option>
                  <option value="missing">{t.operations.missing}</option>
                  <option value="delay">{t.operations.delay}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium md:col-span-2">
                {t.operations.description}
                <Textarea value={newIssueDescription} onChange={(event) => setNewIssueDescription(event.target.value)} rows={3} maxLength={500} required />
              </label>
              <div className="md:col-span-2 md:justify-self-end">
                <Button type="submit"><CircleAlert aria-hidden="true" />{t.operations.reportIssue}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {(mode === 'shipments' || mode === 'incoming' || mode === 'outgoing' || mode === 'approvals') && (
        <Card className="gap-0 py-0">
          <div className="grid gap-3 border-b p-4 sm:grid-cols-[minmax(0,1fr)_15rem]">
            <label className="relative">
              <span className="sr-only">{t.operations.searchShipments}</span>
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.operations.searchShipments} className="h-10 ps-9" />
            </label>
            <select aria-label={t.operations.filterStatus} value={statusFilter} onChange={(event) => {
              const next = event.target.value
              setStatusFilter(next === 'all' ? 'all' : isShipmentStatus(next) ? next : 'all')
            }} className={fieldClass}>
              <option value="all">{t.operations.allStatuses}</option>
              {SHIPMENT_STATUSES.map((status) => <option key={status} value={status}>{t.statuses[status]}</option>)}
            </select>
          </div>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead>{t.operations.trackingNumber}</TableHead>
                  {mode === 'shipments' && <TableHead>{t.operations.flow}</TableHead>}
                  <TableHead>{t.operations.destination}</TableHead>
                  <TableHead>{t.operations.recipient}</TableHead>
                  <TableHead>{t.operations.status}</TableHead>
                  {mode === 'approvals' && <TableHead>{t.operations.approvalStatus}</TableHead>}
                  <TableHead>{t.operations.updatedAt}</TableHead>
                  {mode === 'approvals' && <TableHead className="text-end">{t.operations.actions}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell dir="ltr" className="font-mono font-medium">{shipment.trackingNumber}</TableCell>
                    {mode === 'shipments' && <TableCell>{shipment.flow === 'incoming' ? t.operations.incoming : t.operations.outgoing}</TableCell>}
                    <TableCell>{shipment.destination}</TableCell>
                    <TableCell>{shipment.recipient}</TableCell>
                    <TableCell><StatusBadge status={shipment.status as ShipmentStatus} /></TableCell>
                    {mode === 'approvals' && <TableCell>{t.operations[shipment.approval]}</TableCell>}
                    <TableCell>{formatDateTime(shipment.updatedAt, lang)}</TableCell>
                    {mode === 'approvals' && (
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => decide(shipment.id, 'approved')}>
                            <Check aria-hidden="true" />{t.operations.approve}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => decide(shipment.id, 'rejected')}>
                            <X aria-hidden="true" />{t.operations.reject}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {visibleShipments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={mode === 'approvals' ? 7 : mode === 'shipments' ? 6 : 5} className="py-12 text-center text-sm text-muted-foreground">
                      {t.operations.noShipments}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {mode === 'warehouse-monitoring' && (
        <Card className="gap-0 py-0">
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead>{t.operations.trackingNumber}</TableHead>
                  <TableHead>{t.operations.activity}</TableHead>
                  <TableHead>{t.operations.location}</TableHead>
                  <TableHead>{t.operations.dateTime}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell dir="ltr" className="font-mono font-medium">{activity.trackingNumber}</TableCell>
                    <TableCell>{activity.activity}</TableCell>
                    <TableCell>{activity.location}</TableCell>
                    <TableCell>{formatDateTime(activity.createdAt, lang)}</TableCell>
                  </TableRow>
                ))}
                {activities.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">{t.operations.noActivity}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {mode === 'issues' && (
        <>
          <Card>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead>{t.operations.trackingNumber}</TableHead>
                    <TableHead>{t.operations.issueType}</TableHead>
                    <TableHead>{t.operations.description}</TableHead>
                    <TableHead>{t.operations.status}</TableHead>
                    <TableHead>{t.operations.dateTime}</TableHead>
                    <TableHead className="text-end">{t.operations.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell dir="ltr" className="font-mono font-medium">{issue.trackingNumber}</TableCell>
                      <TableCell>{t.operations[issue.kind]}</TableCell>
                      <TableCell className="max-w-72 whitespace-normal">{issue.description}</TableCell>
                      <TableCell>{issue.state === 'open' ? t.operations.open : t.operations.resolved}</TableCell>
                      <TableCell>{formatDateTime(issue.createdAt, lang)}</TableCell>
                      <TableCell className="text-end">
                        {issue.state === 'open' && <Button size="sm" variant="outline" onClick={() => resolveIssue(issue.id)}>{t.operations.markResolved}</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {issues.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">{t.operations.noIssues}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead>{t.operations.trackingNumber}</TableHead>
                    <TableHead>{t.operations.destination}</TableHead>
                    <TableHead>{t.operations.location}</TableHead>
                    <TableHead>{t.operations.status}</TableHead>
                    <TableHead>{t.operations.updatedAt}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.filter((shipment) => shipment.status === 'delayed').map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell dir="ltr" className="font-mono font-medium">{shipment.trackingNumber}</TableCell>
                      <TableCell>{shipment.destination}</TableCell>
                      <TableCell>{shipment.location}</TableCell>
                      <TableCell><StatusBadge status={shipment.status as ShipmentStatus} /></TableCell>
                      <TableCell>{formatDateTime(shipment.updatedAt, lang)}</TableCell>
                    </TableRow>
                  ))}
                  {!shipments.some((shipment) => shipment.status === 'delayed') && <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">{t.operations.noDelayedShipments}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}
