'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, Eye, Pencil, Plus, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { FormField } from '@/components/common/form-field'
import { PageHeader } from '@/components/common/page-header'
import { ManagementNotice } from '@/components/management/management-notice'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { useLanguage } from '@/contexts/language-context'
import { type ManagedOffice, type ManagedUser } from '@/data/demo-management-data'
import { initials } from '@/lib/format'
import { managementErrorMessage } from '@/lib/management-error-message'
import { type AccountStatus } from '@/types/user'

type OfficeDraft = Pick<ManagedOffice, 'name' | 'code' | 'address' | 'phone' | 'email' | 'status'>
type OfficeDialogState = { mode: 'create' } | { mode: 'edit' | 'details'; office: ManagedOffice }

const fieldClass = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function OfficeStatus({ status }: { status: AccountStatus }) {
  const { t } = useLanguage()
  return (
    <span className={status === 'active'
      ? 'inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700'
      : 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'}>
      {status === 'active' ? t.management.active : t.management.inactive}
    </span>
  )
}

export function OfficeManagementView() {
  const { t } = useLanguage()
  const [offices, setOffices] = useState<ManagedOffice[]>([])
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState<OfficeDialogState | null>(null)
  const [draft, setDraft] = useState<OfficeDraft>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    status: 'active',
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let active = true
    async function loadManagementData() {
      try {
        const [officesResponse, usersResponse] = await Promise.all([
          fetch('/api/management/offices', { cache: 'no-store' }),
          fetch('/api/management/users', { cache: 'no-store' }),
        ])
        const [officesResult, usersResult] = await Promise.all([
          officesResponse.json(),
          usersResponse.json(),
        ])
        if (!officesResponse.ok || !usersResponse.ok) throw new Error('Management data could not be loaded')
        if (!active) return
        setOffices(officesResult.offices)
        setUsers(usersResult.users)
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : null)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void loadManagementData()
    return () => { active = false }
  }, [])
  const visibleOffices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return offices.filter((office) => {
      if (query && !`${office.name} ${office.code} ${office.address}`.toLocaleLowerCase().includes(query)) return false
      return statusFilter === 'all' || office.status === statusFilter
    })
  }, [offices, search, statusFilter])

  function startCreate() {
    setDraft({ name: '', code: '', address: '', phone: '', email: '', status: 'active' })
    setFormError('')
    setDialog({ mode: 'create' })
  }

  function startEdit(office: ManagedOffice) {
    setDraft({
      name: office.name,
      code: office.code,
      address: office.address,
      phone: office.phone,
      email: office.email,
      status: office.status,
    })
    setFormError('')
    setDialog({ mode: 'edit', office })
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.name.trim() || !draft.code.trim() || !draft.address.trim() || !draft.phone.trim() || !draft.email.trim()) {
      setFormError(t.management.officeFieldsRequired)
      return
    }
    const conflictingOffice = offices.some((office) => (
      office.id !== (dialog?.mode === 'edit' ? dialog.office.id : null)
      && office.code.toLocaleLowerCase() === draft.code.trim().toLocaleLowerCase()
    ))
    if (conflictingOffice) {
      setFormError(t.management.officeCodeAlreadyExists)
      return
    }

    setIsSaving(true)
    try {
      const requestBody = {
        ...(dialog?.mode === 'edit' ? { id: dialog.office.id } : {}),
        ...draft,
        name: draft.name.trim(),
        code: draft.code.trim().toUpperCase(),
        address: draft.address.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
      }
      const response = await fetch('/api/management/offices', {
        method: dialog?.mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'request_failed')
      setOffices((current) => dialog?.mode === 'edit'
        ? current.map((office) => office.id === dialog.office.id ? result.office : office)
        : [result.office, ...current])
      setDialog(null)
      toast.success(t.management.officeSaved)
    } catch (error) {
      setFormError(managementErrorMessage(error instanceof Error ? error.message : null, t.management.errors))
    } finally {
      setIsSaving(false)
    }
  }

  const selectedDetails = dialog?.mode === 'details' ? dialog.office : null
  const officeEmployees = selectedDetails
    ? users.filter((entry) => entry.officeId === selectedDetails.id)
    : []
  const assignedManager = (office: ManagedOffice) => users.find((entry) => entry.id === office.managerUserId)

  return (
    <>
      <PageHeader
        title={t.nav.officesBranches}
        description={t.management.officeDescription}
        actions={
          <Button size="lg" onClick={startCreate} disabled={isLoading}>
            <Plus aria-hidden="true" />
            {t.management.createOffice}
          </Button>
        }
      />
      <ManagementNotice>{t.management.officeLiveNotice}</ManagementNotice>
      {loadError && <p role="alert" className="text-sm text-destructive">{managementErrorMessage(loadError, t.management.errors)}</p>}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_15rem]">
            <label className="relative">
              <span className="sr-only">{t.management.searchOffices}</span>
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.management.searchOffices} className="h-10 ps-9" />
            </label>
            <label>
              <span className="sr-only">{t.management.filterStatus}</span>
              <select aria-label={t.management.filterStatus} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={fieldClass}>
                <option value="all">{t.management.allStatuses}</option>
                <option value="active">{t.management.active}</option>
                <option value="inactive">{t.management.inactive}</option>
              </select>
            </label>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead>{t.management.office}</TableHead>
                <TableHead>{t.management.officeManager}</TableHead>
                <TableHead>{t.management.contact}</TableHead>
                <TableHead>{t.management.officeEmployees}</TableHead>
                <TableHead>{t.management.status}</TableHead>
                <TableHead className="text-end">{t.management.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">{t.common.loading}</TableCell></TableRow>
              ) : visibleOffices.map((office) => {
                const manager = assignedManager(office)
                const employeeCount = office.employeeCount ?? users.filter((entry) => entry.officeId === office.id && entry.role !== 'admin').length
                return (
                  <TableRow key={office.id}>
                    <TableCell>
                      <div className="flex min-w-44 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                          <Building2 className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{office.name}</p>
                          <p className="text-xs text-muted-foreground">{office.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{manager?.fullName ?? t.management.unassigned}</TableCell>
                    <TableCell>
                      <p dir="ltr" className="text-start text-sm">{office.phone}</p>
                      <p dir="ltr" className="text-start text-xs text-muted-foreground">{office.email}</p>
                    </TableCell>
                    <TableCell>{employeeCount}</TableCell>
                    <TableCell><OfficeStatus status={office.status} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`${t.management.viewDetails}: ${office.name}`} onClick={() => setDialog({ mode: 'details', office })}>
                          <Eye aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`${t.management.editOffice}: ${office.name}`} onClick={() => startEdit(office)}>
                          <Pencil aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!isLoading && visibleOffices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Building2 className="mx-auto mb-2 size-6 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">{t.management.noOffices}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialog?.mode === 'create' || dialog?.mode === 'edit'} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={saveDraft} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>{dialog?.mode === 'edit' ? t.management.editOffice : t.management.createOffice}</DialogTitle>
              <DialogDescription>{t.management.officeLiveNotice}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="office-name" label={t.management.officeName} required>
                <Input id="office-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </FormField>
              <FormField id="office-code" label={t.management.officeCode} required>
                <Input id="office-code" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} dir="ltr" />
              </FormField>
              <FormField id="office-address" label={t.management.address} required className="sm:col-span-2">
                <Input id="office-address" value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} />
              </FormField>
              <FormField id="office-phone" label={t.management.phone} required>
                <Input id="office-phone" type="tel" dir="ltr" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
              </FormField>
              <FormField id="office-email" label={t.management.email} required>
                <Input id="office-email" type="email" dir="ltr" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
              </FormField>
              <FormField id="office-status" label={t.management.status} required>
                <select id="office-status" value={draft.status} onChange={(event) => {
                  if (event.target.value === 'active' || event.target.value === 'inactive') {
                    setDraft({ ...draft, status: event.target.value })
                  }
                }} className={fieldClass}>
                  <option value="active">{t.management.active}</option>
                  <option value="inactive">{t.management.inactive}</option>
                </select>
              </FormField>
            </div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>{t.common.cancel}</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? t.common.saving : t.common.save}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedDetails)} onOpenChange={(open) => !open && setDialog(null)}>
        {selectedDetails && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedDetails.name}</DialogTitle>
              <DialogDescription>{t.management.liveRecord}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div>
                <p className="font-medium text-foreground">{selectedDetails.code}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedDetails.address}</p>
              </div>
              <OfficeStatus status={selectedDetails.status} />
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                [t.management.phone, selectedDetails.phone],
                [t.management.email, selectedDetails.email],
                [t.management.officeManager, selectedDetails.managerName ?? assignedManager(selectedDetails)?.fullName ?? t.management.unassigned],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd dir={label === t.management.email || label === t.management.phone ? 'ltr' : undefined} className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            <section className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users className="size-4 text-primary" aria-hidden="true" />
                {t.management.officeEmployees}
              </h3>
              {officeEmployees.length ? (
                <ul className="divide-y rounded-lg border px-3">
                  {officeEmployees.map((employee) => (
                    <li key={employee.id} className="flex items-center gap-3 py-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials(employee.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{employee.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{employee.role === 'admin' ? t.management.adminRole : t.roles[employee.role]} · {employee.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border p-4 text-sm text-muted-foreground">{t.management.noOfficeEmployees}</p>
              )}
            </section>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
