'use client'

import { useMemo, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { ManagementNotice } from '@/components/management/management-notice'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/contexts/language-context'
import { AUDIT_ACTIONS, demoAuditLogs, type AuditAction, type AuditLogEntry } from '@/data/demo-audit-logs'
import { demoOperationOffices } from '@/data/demo-shipment-operations'
import { formatDateTime, interpolate, formatNumber } from '@/lib/format'
import { isUserRole, USER_ROLES, type UserRole } from '@/types/user'

type DateFilter = 'all' | 'today' | 'week' | 'month'
type SelectFilter<T extends string> = T | 'all'

const fieldClass = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
const PAGE_SIZE = 8

function isAuditAction(value: string): value is AuditAction {
  return AUDIT_ACTIONS.some((action) => action === value)
}

function isDateFilter(value: string): value is DateFilter {
  return value === 'all' || value === 'today' || value === 'week' || value === 'month'
}

function isDateWithinFilter(value: string, filter: DateFilter) {
  if (filter === 'all') return true
  const date = new Date(value)
  const now = new Date()
  if (Number.isNaN(date.getTime())) return false
  if (filter === 'today') {
    return date.toDateString() === now.toDateString()
  }
  const days = filter === 'week' ? 7 : 30
  const start = new Date(now)
  start.setDate(now.getDate() - days)
  return date >= start && date <= now
}

export function AuditLogsView() {
  const { t, lang } = useLanguage()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<SelectFilter<UserRole>>('all')
  const [actionFilter, setActionFilter] = useState<SelectFilter<AuditAction>>('all')
  const [officeFilter, setOfficeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [page, setPage] = useState(1)
  const [detailsEntry, setDetailsEntry] = useState<AuditLogEntry | null>(null)

  const filteredLogs = useMemo(() => {
    const text = query.trim().toLocaleLowerCase()
    return demoAuditLogs.filter((entry) => {
      if (roleFilter !== 'all' && entry.role !== roleFilter) return false
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false
      if (officeFilter === 'system' && entry.officeId !== null) return false
      if (officeFilter !== 'all' && officeFilter !== 'system' && entry.officeId !== officeFilter) return false
      if (!isDateWithinFilter(entry.createdAt, dateFilter)) return false
      if (!text) return true
      const searchable = [
        entry.userName,
        t.roles[entry.role],
        t.auditLog.actions[entry.action],
        entry.affectedRecord,
        entry.officeName ?? t.auditLog.systemWide,
        t.auditLog.details[entry.details],
      ].join(' ').toLocaleLowerCase()
      return searchable.includes(text)
    })
  }, [query, roleFilter, actionFilter, officeFilter, dateFilter, t])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const from = filteredLogs.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const to = Math.min(currentPage * PAGE_SIZE, filteredLogs.length)
  const number = (value: number) => formatNumber(value, lang)

  function resetPage() {
    setPage(1)
  }

  return (
    <>
      <PageHeader title={t.auditLog.title} description={t.auditLog.description} />
      <ManagementNotice>{t.auditLog.demoNotice}</ManagementNotice>

      <Card className="gap-0 py-0">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))]">
          <label className="relative">
            <span className="sr-only">{t.auditLog.search}</span>
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); resetPage() }} placeholder={t.auditLog.search} className="h-10 ps-9" />
          </label>
          <label>
            <span className="sr-only">{t.auditLog.filterRole}</span>
            <select aria-label={t.auditLog.filterRole} value={roleFilter} onChange={(event) => {
              const value = event.target.value
              setRoleFilter(value === 'all' ? 'all' : isUserRole(value) ? value : 'all')
              resetPage()
            }} className={fieldClass}>
              <option value="all">{t.auditLog.allRoles}</option>
              {USER_ROLES.map((role) => <option key={role} value={role}>{t.roles[role]}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">{t.auditLog.filterAction}</span>
            <select aria-label={t.auditLog.filterAction} value={actionFilter} onChange={(event) => {
              const value = event.target.value
              setActionFilter(value === 'all' ? 'all' : isAuditAction(value) ? value : 'all')
              resetPage()
            }} className={fieldClass}>
              <option value="all">{t.auditLog.allActions}</option>
              {AUDIT_ACTIONS.map((action) => <option key={action} value={action}>{t.auditLog.actions[action]}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">{t.auditLog.filterOffice}</span>
            <select aria-label={t.auditLog.filterOffice} value={officeFilter} onChange={(event) => { setOfficeFilter(event.target.value); resetPage() }} className={fieldClass}>
              <option value="all">{t.auditLog.allOffices}</option>
              <option value="system">{t.auditLog.systemWide}</option>
              {demoOperationOffices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">{t.auditLog.filterDate}</span>
            <select aria-label={t.auditLog.filterDate} value={dateFilter} onChange={(event) => {
              if (isDateFilter(event.target.value)) setDateFilter(event.target.value)
              resetPage()
            }} className={fieldClass}>
              <option value="all">{t.auditLog.allDates}</option>
              <option value="today">{t.auditLog.today}</option>
              <option value="week">{t.auditLog.last7Days}</option>
              <option value="month">{t.auditLog.last30Days}</option>
            </select>
          </label>
        </div>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead>{t.auditLog.user}</TableHead>
                <TableHead>{t.auditLog.role}</TableHead>
                <TableHead>{t.auditLog.action}</TableHead>
                <TableHead>{t.auditLog.affectedRecord}</TableHead>
                <TableHead>{t.auditLog.office}</TableHead>
                <TableHead>{t.auditLog.dateTime}</TableHead>
                <TableHead className="text-end">{t.auditLog.activityDetails}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.userName}</TableCell>
                  <TableCell>{t.roles[entry.role]}</TableCell>
                  <TableCell>{t.auditLog.actions[entry.action]}</TableCell>
                  <TableCell dir="ltr" className="max-w-48 truncate font-mono text-xs">{entry.affectedRecord}</TableCell>
                  <TableCell>{entry.officeName ?? t.auditLog.systemWide}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(entry.createdAt, lang)}</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon-sm" aria-label={`${t.auditLog.viewDetails}: ${entry.affectedRecord}`} onClick={() => setDetailsEntry(entry)}>
                      <Eye aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">{t.auditLog.noRecords}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex flex-col items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row">
          <p aria-live="polite">{interpolate(t.auditLog.showing, { from: number(from), to: number(to), total: number(filteredLogs.length) })}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>{t.common.previous}</Button>
            <span className="px-1 text-xs">{interpolate(t.common.pageOf, { page: number(currentPage), total: number(totalPages) })}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>{t.common.next}</Button>
          </div>
        </div>
      </Card>

      <Dialog open={Boolean(detailsEntry)} onOpenChange={(open) => !open && setDetailsEntry(null)}>
        {detailsEntry && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t.auditLog.activityDetails}</DialogTitle>
              <DialogDescription>{t.auditLog.demoRecord}</DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                [t.auditLog.user, detailsEntry.userName],
                [t.auditLog.role, t.roles[detailsEntry.role]],
                [t.auditLog.action, t.auditLog.actions[detailsEntry.action]],
                [t.auditLog.affectedRecord, detailsEntry.affectedRecord],
                [t.auditLog.office, detailsEntry.officeName ?? t.auditLog.systemWide],
                [t.auditLog.dateTime, formatDateTime(detailsEntry.createdAt, lang)],
                [t.auditLog.activityDetails, t.auditLog.details[detailsEntry.details]],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd dir={label === t.auditLog.affectedRecord ? 'ltr' : undefined} className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
