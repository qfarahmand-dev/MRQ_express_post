'use client'

import { useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine, Check, CircleAlert, MapPin, ScanSearch, Search, Warehouse } from 'lucide-react'
import { toast } from 'sonner'
import { FormField } from '@/components/common/form-field'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { ManagementNotice } from '@/components/management/management-notice'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import {
  demoOperationOffices,
  demoOperationalIssues,
  demoOperationalShipments,
  demoOperationalTransfers,
  demoWarehouseActivities,
  forAssignedOffice,
  type OperationalIssue,
  type OperationalShipment,
  type OperationalTransfer,
  type ShipmentIssueKind,
  type WarehouseActivity,
} from '@/data/demo-shipment-operations'
import { formatDateTime } from '@/lib/format'
import { normalizeTrackingNumber } from '@/lib/validation'
import { SHIPMENT_STATUSES, type ShipmentStatus } from '@/types/shipment'

export type WarehouseMode = 'incoming' | 'outgoing' | 'warehouse' | 'scanning' | 'issues' | 'transfers'

type PendingStatusChange = {
  shipmentId: string
  status: ShipmentStatus
  action: 'receive' | 'prepare' | 'dispatch'
}

const fieldClass = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const headingByMode: Record<WarehouseMode, keyof import('@/lib/i18n').Dictionary['operations']> = {
  incoming: 'incomingTitle',
  outgoing: 'outgoingTitle',
  warehouse: 'storedShipmentsTitle',
  scanning: 'scanningTitle',
  issues: 'storekeeperIssuesTitle',
  transfers: 'transfersTitle',
}

const descriptionByMode: Record<WarehouseMode, keyof import('@/lib/i18n').Dictionary['operations']> = {
  incoming: 'incomingDescription',
  outgoing: 'outgoingDescription',
  warehouse: 'storedShipmentsDescription',
  scanning: 'scanningDescription',
  issues: 'storekeeperIssuesDescription',
  transfers: 'transfersDescription',
}

function isShipmentStatus(value: string): value is ShipmentStatus {
  return SHIPMENT_STATUSES.some((status) => status === value)
}

export function WarehouseManagementView({ mode }: { mode: WarehouseMode }) {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const officeId = user?.officeId ?? (isAdmin ? 'demo-office-kbl' : undefined)
  const shipmentRows = isAdmin ? demoOperationalShipments : officeId ? forAssignedOffice(demoOperationalShipments, officeId) : []
  const issueRows = isAdmin ? demoOperationalIssues.filter((issue) => issue.kind !== 'delay') : officeId ? forAssignedOffice(demoOperationalIssues, officeId).filter((issue) => issue.kind !== 'delay') : []
  const transferRows = isAdmin ? demoOperationalTransfers : officeId ? forAssignedOffice(demoOperationalTransfers, officeId) : []
  const activityRows = isAdmin ? demoWarehouseActivities : officeId ? forAssignedOffice(demoWarehouseActivities, officeId) : []
  const [shipments, setShipments] = useState<OperationalShipment[]>(shipmentRows)
  const [issues, setIssues] = useState<OperationalIssue[]>(issueRows)
  const [transfers, setTransfers] = useState<OperationalTransfer[]>(transferRows)
  const [activities, setActivities] = useState<WarehouseActivity[]>(activityRows)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all')
  const [locationDrafts, setLocationDrafts] = useState<Record<string, string>>({})
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null)
  const [scanValue, setScanValue] = useState('')
  const [scanQuery, setScanQuery] = useState('')
  const [issueTracking, setIssueTracking] = useState('')
  const [issueKind, setIssueKind] = useState<ShipmentIssueKind>('damaged')
  const [issueDescription, setIssueDescription] = useState('')
  const [transferTracking, setTransferTracking] = useState('')
  const [transferDestinationType, setTransferDestinationType] = useState<'office' | 'department'>('office')
  const [transferDestination, setTransferDestination] = useState('')
  const [transferNote, setTransferNote] = useState('')

  const visibleShipments = useMemo(() => {
    const text = query.trim().toLocaleLowerCase()
    return shipments.filter((shipment) => {
      if (mode === 'incoming' && shipment.flow !== 'incoming') return false
      if (mode === 'outgoing' && shipment.flow !== 'outgoing') return false
      if (mode === 'warehouse' && shipment.status !== 'in_warehouse') return false
      if (statusFilter !== 'all' && shipment.status !== statusFilter) return false
      if (text && !`${shipment.trackingNumber} ${shipment.destination} ${shipment.recipient} ${shipment.storageLocation}`.toLocaleLowerCase().includes(text)) return false
      return true
    })
  }, [shipments, mode, statusFilter, query])

  const scannedShipment = scanQuery
    ? shipments.find((shipment) => normalizeTrackingNumber(shipment.trackingNumber) === scanQuery)
    : undefined

  function requestStatusChange(shipment: OperationalShipment, action: PendingStatusChange['action'], status: ShipmentStatus) {
    setPendingStatusChange({ shipmentId: shipment.id, status, action })
  }

  function confirmStatusChange() {
    if (!pendingStatusChange || !officeId) return
    const shipment = shipments.find((entry) => entry.id === pendingStatusChange.shipmentId)
    if (!shipment) return
    const activityLabel = pendingStatusChange.action === 'receive'
      ? t.operations.receiveShipment
      : pendingStatusChange.action === 'prepare'
        ? t.operations.prepareForDispatch
        : t.operations.confirmDispatch
    const location = pendingStatusChange.status === 'in_warehouse' ? shipment.location : t.operations.dispatchBay

    setShipments((current) => current.map((entry) => entry.id === shipment.id
      ? { ...entry, status: pendingStatusChange.status, location, updatedAt: new Date().toISOString() }
      : entry))
    setActivities((current) => [{
      id: `demo-activity-${crypto.randomUUID()}`,
      trackingNumber: shipment.trackingNumber,
      officeId,
      activity: activityLabel,
      location,
      createdAt: new Date().toISOString(),
    }, ...current])
    setPendingStatusChange(null)
    toast.info(t.operations.previewChangeNotice)
  }

  function recordStorageLocation(event: React.FormEvent<HTMLFormElement>, shipment: OperationalShipment) {
    event.preventDefault()
    if (!officeId) return
    const location = (locationDrafts[shipment.id] ?? shipment.storageLocation).trim()
    if (!location) return
    setShipments((current) => current.map((entry) => entry.id === shipment.id ? { ...entry, storageLocation: location } : entry))
    setActivities((current) => [{
      id: `demo-activity-${crypto.randomUUID()}`,
      trackingNumber: shipment.trackingNumber,
      officeId,
      activity: t.operations.storageLocationRecorded,
      location,
      createdAt: new Date().toISOString(),
    }, ...current])
    toast.info(t.operations.previewChangeNotice)
  }

  function submitScan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setScanQuery(normalizeTrackingNumber(scanValue))
  }

  function createIssue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!officeId || !issueTracking.trim() || !issueDescription.trim()) return
    setIssues((current) => [{
      id: `demo-issue-${crypto.randomUUID()}`,
      trackingNumber: normalizeTrackingNumber(issueTracking),
      officeId,
      kind: issueKind,
      description: issueDescription.trim(),
      state: 'open',
      createdAt: new Date().toISOString(),
    }, ...current])
    setIssueTracking('')
    setIssueDescription('')
    toast.info(t.operations.previewChangeNotice)
  }

  function registerTransfer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!officeId || !transferTracking.trim() || !transferDestination) return
    const destinationName = transferDestinationType === 'office'
      ? demoOperationOffices.find((office) => office.id === transferDestination)?.name
      : transferDestination === 'sorting'
        ? t.operations.sortingDepartment
        : transferDestination === 'dispatch'
          ? t.operations.dispatchDepartment
          : transferDestination === 'quality'
            ? t.operations.qualityDepartment
            : undefined
    if (!destinationName) return
    setTransfers((current) => [{
      id: `demo-transfer-${crypto.randomUUID()}`,
      trackingNumber: normalizeTrackingNumber(transferTracking),
      officeId,
      fromOffice: isAdmin ? t.operations.allOffices : t.operations.assignedOffice,
      toOffice: destinationName,
      state: 'in_transit',
      createdAt: new Date().toISOString(),
      note: transferNote.trim(),
    }, ...current])
    setTransferTracking('')
    setTransferDestination('')
    setTransferNote('')
    toast.info(t.operations.previewChangeNotice)
  }

  function markTransferReceived(transferId: string) {
    setTransfers((current) => current.map((transfer) => transfer.id === transferId ? { ...transfer, state: 'received' } : transfer))
    toast.info(t.operations.previewChangeNotice)
  }

  if (!officeId) {
    return (
      <>
        <PageHeader title={t.operations[headingByMode[mode]]} description={t.operations[descriptionByMode[mode]]} />
        <ManagementNotice>{t.operations.officeAssignmentMissing}</ManagementNotice>
      </>
    )
  }

  return (
    <>
      <PageHeader title={t.operations[headingByMode[mode]]} description={t.operations[descriptionByMode[mode]]} />
      <ManagementNotice>{t.operations.demoNotice}</ManagementNotice>

      {(mode === 'incoming' || mode === 'outgoing' || mode === 'warehouse') && (
        <Card className="gap-0 py-0">
          <div className="grid gap-3 border-b p-4 sm:grid-cols-[minmax(0,1fr)_15rem]">
            <label className="relative">
              <span className="sr-only">{t.operations.searchShipments}</span>
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.operations.searchShipments} className="h-10 ps-9" />
            </label>
            <select aria-label={t.operations.filterStatus} value={statusFilter} onChange={(event) => setStatusFilter(isShipmentStatus(event.target.value) ? event.target.value : 'all')} className={fieldClass}>
              <option value="all">{t.operations.allStatuses}</option>
              {SHIPMENT_STATUSES.map((status) => <option key={status} value={status}>{t.statuses[status]}</option>)}
            </select>
          </div>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead>{t.operations.trackingNumber}</TableHead>
                  <TableHead>{t.operations.destination}</TableHead>
                  <TableHead>{t.operations.recipient}</TableHead>
                  <TableHead>{t.operations.status}</TableHead>
                  {mode === 'warehouse' && <TableHead>{t.operations.storageLocation}</TableHead>}
                  <TableHead>{t.operations.updatedAt}</TableHead>
                  <TableHead className="text-end">{t.operations.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell dir="ltr" className="font-mono font-medium">{shipment.trackingNumber}</TableCell>
                    <TableCell>{shipment.destination}</TableCell>
                    <TableCell>{shipment.recipient}</TableCell>
                    <TableCell><StatusBadge status={shipment.status} /></TableCell>
                    {mode === 'warehouse' && (
                      <TableCell>
                        <form className="flex min-w-56 gap-2" onSubmit={(event) => recordStorageLocation(event, shipment)}>
                          <Input
                            aria-label={`${t.operations.storageLocation}: ${shipment.trackingNumber}`}
                            value={locationDrafts[shipment.id] ?? shipment.storageLocation}
                            onChange={(event) => setLocationDrafts((current) => ({ ...current, [shipment.id]: event.target.value }))}
                            placeholder={t.operations.storageLocationPlaceholder}
                            className="h-9"
                            required
                          />
                          <Button type="submit" size="sm" variant="outline"><MapPin aria-hidden="true" />{t.operations.recordLocation}</Button>
                        </form>
                      </TableCell>
                    )}
                    <TableCell>{formatDateTime(shipment.updatedAt, lang)}</TableCell>
                    <TableCell className="text-end">
                      {mode === 'incoming' && (
                        shipment.status === 'in_warehouse'
                          ? <span className="text-xs text-muted-foreground">{t.operations.stored}</span>
                          : <Button size="sm" onClick={() => requestStatusChange(shipment, 'receive', 'in_warehouse')}>
                            <ArrowDownToLine aria-hidden="true" />{t.operations.receiveShipment}
                          </Button>
                      )}
                      {mode === 'outgoing' && shipment.status === 'in_warehouse' && (
                        <Button size="sm" onClick={() => requestStatusChange(shipment, 'dispatch', 'dispatched')}>
                          <ArrowUpFromLine aria-hidden="true" />{t.operations.confirmDispatch}
                        </Button>
                      )}
                      {mode === 'outgoing' && shipment.status === 'registered' && (
                        <Button size="sm" variant="outline" onClick={() => requestStatusChange(shipment, 'prepare', 'in_warehouse')}>
                          <Warehouse aria-hidden="true" />{t.operations.prepareForDispatch}
                        </Button>
                      )}
                      {mode === 'warehouse' && <span className="text-xs text-muted-foreground">{t.operations.stored}</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {visibleShipments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={mode === 'warehouse' ? 7 : 6} className="py-12 text-center text-sm text-muted-foreground">{t.operations.noShipments}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {mode === 'scanning' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t.operations.scanningTitle}</CardTitle>
              <CardDescription>{t.operations.scannerHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitScan} className="flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="warehouse-tracking-scan">{t.operations.trackingNumber}</label>
                <Input
                  id="warehouse-tracking-scan"
                  dir="ltr"
                  autoComplete="off"
                  autoFocus
                  value={scanValue}
                  onChange={(event) => setScanValue(event.target.value)}
                  placeholder={t.operations.enterTrackingNumber}
                  className="h-11 font-mono"
                />
                <Button type="submit" size="lg"><ScanSearch aria-hidden="true" />{t.operations.scanTrackingNumber}</Button>
              </form>
            </CardContent>
          </Card>
          {scanQuery && (
            scannedShipment ? (
              <Card>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar><AvatarFallback className="bg-primary text-primary-foreground"><ScanSearch className="size-4" aria-hidden="true" /></AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <p dir="ltr" className="font-mono font-semibold text-foreground">{scannedShipment.trackingNumber}</p>
                      <p className="truncate text-sm text-muted-foreground">{scannedShipment.destination} · {scannedShipment.recipient}</p>
                    </div>
                    <StatusBadge status={scannedShipment.status} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scannedShipment.flow === 'incoming' && scannedShipment.status !== 'in_warehouse' && (
                      <Button onClick={() => requestStatusChange(scannedShipment, 'receive', 'in_warehouse')}><ArrowDownToLine aria-hidden="true" />{t.operations.confirmArrival}</Button>
                    )}
                    {scannedShipment.flow === 'outgoing' && scannedShipment.status === 'in_warehouse' && (
                      <Button onClick={() => requestStatusChange(scannedShipment, 'dispatch', 'dispatched')}><ArrowUpFromLine aria-hidden="true" />{t.operations.confirmDispatch}</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p role="status" className="rounded-lg border p-4 text-sm text-muted-foreground">{t.operations.trackingNotFound}</p>
            )
          )}
        </>
      )}

      {mode === 'issues' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t.operations.reportIssue}</CardTitle>
              <CardDescription>{t.operations.issueDemoHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createIssue} className="grid gap-4 md:grid-cols-2">
                <FormField id="warehouse-issue-tracking" label={t.operations.trackingNumber} required>
                  <Input id="warehouse-issue-tracking" dir="ltr" value={issueTracking} onChange={(event) => setIssueTracking(event.target.value)} required />
                </FormField>
                <FormField id="warehouse-issue-type" label={t.operations.issueType} required>
                  <select id="warehouse-issue-type" value={issueKind} onChange={(event) => {
                    if (event.target.value === 'damaged' || event.target.value === 'missing') setIssueKind(event.target.value)
                  }} className={fieldClass}>
                    <option value="damaged">{t.operations.damaged}</option>
                    <option value="missing">{t.operations.missing}</option>
                  </select>
                </FormField>
                <FormField id="warehouse-issue-description" label={t.operations.description} required className="md:col-span-2">
                  <Textarea id="warehouse-issue-description" value={issueDescription} onChange={(event) => setIssueDescription(event.target.value)} rows={3} maxLength={500} required />
                </FormField>
                <div className="md:col-span-2 md:justify-self-end">
                  <Button type="submit"><CircleAlert aria-hidden="true" />{t.operations.submitIssue}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card className="gap-0 py-0">
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead>{t.operations.trackingNumber}</TableHead>
                    <TableHead>{t.operations.issueType}</TableHead>
                    <TableHead>{t.operations.description}</TableHead>
                    <TableHead>{t.operations.status}</TableHead>
                    <TableHead>{t.operations.dateTime}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell dir="ltr" className="font-mono font-medium">{issue.trackingNumber}</TableCell>
                      <TableCell>{issue.kind === 'damaged' ? t.operations.damaged : t.operations.missing}</TableCell>
                      <TableCell className="max-w-80 whitespace-normal">{issue.description}</TableCell>
                      <TableCell>{issue.state === 'open' ? t.operations.open : t.operations.resolved}</TableCell>
                      <TableCell>{formatDateTime(issue.createdAt, lang)}</TableCell>
                    </TableRow>
                  ))}
                  {issues.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">{t.operations.noIssues}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {mode === 'transfers' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t.operations.registerTransfer}</CardTitle>
              <CardDescription>{t.operations.transferDemoHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={registerTransfer} className="grid gap-4 md:grid-cols-2">
                <FormField id="transfer-tracking" label={t.operations.trackingNumber} required>
                  <Input id="transfer-tracking" dir="ltr" value={transferTracking} onChange={(event) => setTransferTracking(event.target.value)} required />
                </FormField>
                <FormField id="transfer-destination-type" label={t.operations.destinationType} required>
                  <select
                    id="transfer-destination-type"
                    value={transferDestinationType}
                    onChange={(event) => {
                      if (event.target.value === 'office' || event.target.value === 'department') {
                        setTransferDestinationType(event.target.value)
                        setTransferDestination('')
                      }
                    }}
                    className={fieldClass}
                  >
                    <option value="office">{t.operations.office}</option>
                    <option value="department">{t.operations.department}</option>
                  </select>
                </FormField>
                <FormField id="transfer-destination" label={transferDestinationType === 'office' ? t.operations.destinationOffice : t.operations.department} required>
                  <select id="transfer-destination" value={transferDestination} onChange={(event) => setTransferDestination(event.target.value)} className={fieldClass} required>
                    <option value="">{transferDestinationType === 'office' ? t.operations.selectDestination : t.operations.selectDepartment}</option>
                    {transferDestinationType === 'office'
                      ? demoOperationOffices.filter((office) => isAdmin || office.id !== officeId).map((office) => <option key={office.id} value={office.id}>{office.name}</option>)
                      : (
                        <>
                          <option value="sorting">{t.operations.sortingDepartment}</option>
                          <option value="dispatch">{t.operations.dispatchDepartment}</option>
                          <option value="quality">{t.operations.qualityDepartment}</option>
                        </>
                      )}
                  </select>
                </FormField>
                <FormField id="transfer-note" label={t.operations.notes} className="md:col-span-2">
                  <Textarea id="transfer-note" value={transferNote} onChange={(event) => setTransferNote(event.target.value)} rows={2} maxLength={300} />
                </FormField>
                <div className="md:col-span-2 md:justify-self-end">
                  <Button type="submit"><ArrowRightLeft aria-hidden="true" />{t.operations.registerTransfer}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card className="gap-0 py-0">
            <CardContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead>{t.operations.trackingNumber}</TableHead>
                    <TableHead>{t.operations.sourceOffice}</TableHead>
                    <TableHead>{t.operations.destinationOffice}</TableHead>
                    <TableHead>{t.operations.notes}</TableHead>
                    <TableHead>{t.operations.status}</TableHead>
                    <TableHead>{t.operations.dateTime}</TableHead>
                    <TableHead className="text-end">{t.operations.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell dir="ltr" className="font-mono font-medium">{transfer.trackingNumber}</TableCell>
                      <TableCell>{transfer.fromOffice}</TableCell>
                      <TableCell>{transfer.toOffice}</TableCell>
                      <TableCell className="max-w-48 whitespace-normal">{transfer.note || t.operations.notAvailable}</TableCell>
                      <TableCell>
                        <span className={transfer.state === 'received'
                          ? 'inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700'
                          : 'inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700'}>
                          {transfer.state === 'received' ? t.operations.transferReceived : t.operations.transferInTransit}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateTime(transfer.createdAt, lang)}</TableCell>
                      <TableCell className="text-end">
                        {transfer.state === 'in_transit' && <Button size="sm" variant="outline" onClick={() => markTransferReceived(transfer.id)}><Check aria-hidden="true" />{t.operations.confirmTransferReceipt}</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {transfers.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">{t.operations.noTransfers}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={Boolean(pendingStatusChange)} onOpenChange={(open) => !open && setPendingStatusChange(null)}>
        {pendingStatusChange && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {pendingStatusChange.action === 'receive'
                  ? t.operations.confirmArrival
                  : pendingStatusChange.action === 'prepare'
                    ? t.operations.prepareForDispatch
                    : t.operations.confirmDispatch}
              </DialogTitle>
              <DialogDescription>
                {t.operations.confirmStatusChange
                  .replace('{tracking}', shipments.find((shipment) => shipment.id === pendingStatusChange.shipmentId)?.trackingNumber ?? '')
                  .replace('{status}', t.statuses[pendingStatusChange.status])}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingStatusChange(null)}>{t.common.cancel}</Button>
              <Button onClick={confirmStatusChange}>{t.operations.confirmAction}</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
