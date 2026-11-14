'use client'

import { useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search, UserRound, UserRoundCheck, UserRoundX } from 'lucide-react'
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
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { demoManagedOffices, demoManagedUsers, type ManagedUser } from '@/data/demo-management-data'
import { formatDate, initials } from '@/lib/format'
import { isValidEmail } from '@/lib/validation'
import { isUserRole, USER_ROLES, type AccountStatus } from '@/types/user'

type UserDraft = Pick<ManagedUser, 'fullName' | 'email' | 'role' | 'officeId' | 'accountStatus'>
type UserDialogState = { mode: 'create' } | { mode: 'edit' | 'details'; user: ManagedUser }
type FilterValue = 'all' | string

const fieldClass = 'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function StatusPill({ status }: { status: AccountStatus }) {
  const { t } = useLanguage()
  return (
    <span className={status === 'active'
      ? 'inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700'
      : 'inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'}>
      {status === 'active' ? t.management.active : t.management.inactive}
    </span>
  )
}

export function UserManagementView({ officeEmployeesOnly = false }: { officeEmployeesOnly?: boolean }) {
  const { t, lang } = useLanguage()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState(demoManagedUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<FilterValue>('all')
  const [officeFilter, setOfficeFilter] = useState<FilterValue>('all')
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all')
  const [dialog, setDialog] = useState<UserDialogState | null>(null)
  const [deactivatingUser, setDeactivatingUser] = useState<ManagedUser | null>(null)
  const [draft, setDraft] = useState<UserDraft>({
    fullName: '',
    email: '',
    role: officeEmployeesOnly ? 'storekeeper' : 'office_manager',
    officeId: officeEmployeesOnly ? currentUser?.officeId ?? null : null,
    accountStatus: 'active',
  })
  const [formError, setFormError] = useState('')

  const isManager = officeEmployeesOnly
  const visibleUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return users.filter((entry) => {
      if (isManager && (!currentUser?.officeId || entry.officeId !== currentUser.officeId || entry.role === 'admin')) return false
      if (query && !`${entry.fullName} ${entry.email}`.toLocaleLowerCase().includes(query)) return false
      if (roleFilter !== 'all' && entry.role !== roleFilter) return false
      if (!isManager && officeFilter !== 'all' && entry.officeId !== officeFilter) return false
      if (statusFilter !== 'all' && entry.accountStatus !== statusFilter) return false
      return true
    })
  }, [users, search, roleFilter, officeFilter, statusFilter, isManager, currentUser?.officeId])

  function startCreate() {
    setDraft({
      fullName: '',
      email: '',
      role: isManager ? 'storekeeper' : 'office_manager',
      officeId: isManager ? currentUser?.officeId ?? null : null,
      accountStatus: 'active',
    })
    setFormError('')
    setDialog({ mode: 'create' })
  }

  function startEdit(entry: ManagedUser) {
    setDraft({
      fullName: entry.fullName,
      email: entry.email,
      role: entry.role,
      officeId: isManager ? currentUser?.officeId ?? null : entry.officeId,
      accountStatus: entry.accountStatus,
    })
    setFormError('')
    setDialog({ mode: 'edit', user: entry })
  }

  function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const officeId = isManager ? currentUser?.officeId ?? null : draft.officeId
    if (!draft.fullName.trim()) {
      setFormError(t.form.errors.required)
      return
    }
    if (!isValidEmail(draft.email)) {
      setFormError(t.login.errors.emailInvalid)
      return
    }
    if (users.some((entry) => entry.email.toLocaleLowerCase() === draft.email.trim().toLocaleLowerCase() && (dialog?.mode !== 'edit' || entry.id !== dialog.user.id))) {
      setFormError(t.management.emailAlreadyExists)
      return
    }
    if (!officeId && draft.role !== 'admin') {
      setFormError(t.management.officeRequired)
      return
    }

    const nextUser: ManagedUser = {
      id: dialog?.mode === 'edit' ? dialog.user.id : `demo-user-${crypto.randomUUID()}`,
      fullName: draft.fullName.trim(),
      email: draft.email.trim(),
      role: draft.role,
      officeId: draft.role === 'admin' ? null : officeId,
      accountStatus: draft.accountStatus,
      createdAt: dialog?.mode === 'edit' ? dialog.user.createdAt : new Date().toISOString(),
      lastLoginAt: dialog?.mode === 'edit' ? dialog.user.lastLoginAt : null,
    }

    setUsers((current) => dialog?.mode === 'edit'
      ? current.map((entry) => entry.id === dialog.user.id ? nextUser : entry)
      : [nextUser, ...current])
    setDialog(null)
    toast.info(t.management.previewChangeNotice)
  }

  function toggleStatus() {
    if (!deactivatingUser) return
    const nextStatus = deactivatingUser.accountStatus === 'active' ? 'inactive' : 'active'
    setUsers((current) => current.map((entry) => entry.id === deactivatingUser.id
      ? { ...entry, accountStatus: nextStatus }
      : entry))
    setDeactivatingUser(null)
    toast.info(t.management.previewChangeNotice)
  }

  const officeName = (officeId: string | null) => (
    officeId ? demoManagedOffices.find((office) => office.id === officeId)?.name ?? officeId : t.management.noOffice
  )

  if (isManager && !currentUser?.officeId) {
    return (
      <>
        <PageHeader title={t.nav.officeEmployees} description={t.management.employeeDescription} />
        <ManagementNotice>{t.management.officeAssignmentMissing}</ManagementNotice>
      </>
    )
  }

  const selectedDetails = dialog?.mode === 'details' ? dialog.user : null
  const formOpen = dialog?.mode === 'create' || dialog?.mode === 'edit'

  return (
    <>
      <PageHeader
        title={isManager ? t.nav.officeEmployees : t.nav.usersManagement}
        description={isManager ? t.management.employeeDescription : t.management.userDescription}
        actions={
          <Button size="lg" onClick={startCreate}>
            <Plus aria-hidden="true" />
            {isManager ? t.management.addEmployee : t.management.createUser}
          </Button>
        }
      />
      <ManagementNotice>{t.management.userDemoNotice}</ManagementNotice>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="relative">
              <span className="sr-only">{t.management.searchPeople}</span>
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.management.searchPeople}
                className="h-10 ps-9"
              />
            </label>
            <label>
              <span className="sr-only">{t.management.filterRole}</span>
              <select aria-label={t.management.filterRole} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className={fieldClass}>
                <option value="all">{t.management.allRoles}</option>
                {USER_ROLES.map((role) => <option key={role} value={role}>{role === 'admin' ? t.management.adminRole : t.roles[role]}</option>)}
              </select>
            </label>
            {isManager ? (
              <div className="flex h-10 items-center rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground">
                {demoManagedOffices.find((office) => office.id === currentUser?.officeId)?.name ?? currentUser?.officeId}
              </div>
            ) : (
              <label>
                <span className="sr-only">{t.management.filterOffice}</span>
                <select aria-label={t.management.filterOffice} value={officeFilter} onChange={(event) => setOfficeFilter(event.target.value)} className={fieldClass}>
                  <option value="all">{t.management.allOffices}</option>
                  {demoManagedOffices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
                  <option value="">{t.management.noOffice}</option>
                </select>
              </label>
            )}
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
                <TableHead>{t.management.user}</TableHead>
                <TableHead>{t.management.role}</TableHead>
                {!isManager && <TableHead>{t.management.office}</TableHead>}
                <TableHead>{t.management.status}</TableHead>
                <TableHead>{t.management.lastLogin}</TableHead>
                <TableHead>{t.management.registrationDate}</TableHead>
                <TableHead className="text-end">{t.management.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="flex min-w-48 items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials(entry.fullName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{entry.fullName}</p>
                        <p dir="ltr" className="truncate text-xs text-muted-foreground">{entry.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{t.roles[entry.role]}</TableCell>
                  {!isManager && <TableCell>{officeName(entry.officeId)}</TableCell>}
                  <TableCell><StatusPill status={entry.accountStatus} /></TableCell>
                  <TableCell>{entry.lastLoginAt ? formatDate(entry.lastLoginAt, lang) : t.management.notAvailable}</TableCell>
                  <TableCell>{formatDate(entry.createdAt, lang)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`${t.management.viewDetails}: ${entry.fullName}`} onClick={() => setDialog({ mode: 'details', user: entry })}>
                        <Eye aria-hidden="true" />
                      </Button>
                      {!(isManager && entry.id === currentUser?.id) && (
                        <>
                          <Button variant="ghost" size="icon-sm" aria-label={`${t.management.editUser}: ${entry.fullName}`} onClick={() => startEdit(entry)}>
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${entry.accountStatus === 'active' ? t.management.deactivate : t.management.activate}: ${entry.fullName}`}
                            onClick={() => setDeactivatingUser(entry)}
                          >
                            {entry.accountStatus === 'active' ? <UserRoundX aria-hidden="true" /> : <UserRoundCheck aria-hidden="true" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {visibleUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isManager ? 6 : 7} className="py-12 text-center">
                    <UserRound className="mx-auto mb-2 size-6 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">{t.management.noUsers}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(formOpen)} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <form onSubmit={saveDraft} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle>{dialog?.mode === 'edit' ? t.management.editUser : t.management.createUser}</DialogTitle>
              <DialogDescription>{t.management.userDemoNotice}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="managed-user-name" label={t.management.fullName} required>
                <Input id="managed-user-name" value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} autoComplete="name" />
              </FormField>
              <FormField id="managed-user-email" label={t.management.email} required>
                <Input id="managed-user-email" type="email" dir="ltr" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} autoComplete="email" />
              </FormField>
              <FormField id="managed-user-role" label={t.management.role} required>
                <select
                  id="managed-user-role"
                  value={draft.role}
                  onChange={(event) => {
                    if (!isUserRole(event.target.value) || (isManager && event.target.value === 'admin')) return
                    setDraft({
                      ...draft,
                      role: event.target.value,
                      officeId: event.target.value === 'admin' ? null : isManager ? currentUser?.officeId ?? null : draft.officeId,
                    })
                  }}
                  className={fieldClass}
                >
                  {USER_ROLES.map((role) => <option key={role} value={role} disabled={isManager && role === 'admin'}>{role === 'admin' ? t.management.adminRole : t.roles[role]}</option>)}
                </select>
              </FormField>
              {draft.role !== 'admin' && (
                <FormField id="managed-user-office" label={t.management.office} required>
                  {isManager ? (
                    <Input id="managed-user-office" value={demoManagedOffices.find((office) => office.id === currentUser?.officeId)?.name ?? currentUser?.officeId ?? ''} readOnly />
                  ) : (
                    <select id="managed-user-office" value={draft.officeId ?? ''} onChange={(event) => setDraft({ ...draft, officeId: event.target.value || null })} className={fieldClass}>
                      <option value="">{t.management.selectOffice}</option>
                      {demoManagedOffices.filter((office) => office.status === 'active').map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
                    </select>
                  )}
                </FormField>
              )}
              <FormField id="managed-user-status" label={t.management.status} required>
                <select id="managed-user-status" value={draft.accountStatus} onChange={(event) => {
                  if (event.target.value === 'active' || event.target.value === 'inactive') {
                    setDraft({ ...draft, accountStatus: event.target.value })
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
              <Button type="submit">{t.management.savePreview}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedDetails)} onOpenChange={(open) => !open && setDialog(null)}>
        {selectedDetails && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.management.userDetails}</DialogTitle>
              <DialogDescription>{t.management.demoRecord}</DialogDescription>
            </DialogHeader>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                [t.management.fullName, selectedDetails.fullName],
                [t.management.email, selectedDetails.email],
                [t.management.role, t.roles[selectedDetails.role]],
                [t.management.office, officeName(selectedDetails.officeId)],
                [t.management.status, selectedDetails.accountStatus === 'active' ? t.management.active : t.management.inactive],
                [t.management.registrationDate, formatDate(selectedDetails.createdAt, lang)],
                [t.management.lastLogin, selectedDetails.lastLoginAt ? formatDate(selectedDetails.lastLoginAt, lang) : t.management.notAvailable],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-3">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd dir={label === t.management.email ? 'ltr' : undefined} className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={Boolean(deactivatingUser)} onOpenChange={(open) => !open && setDeactivatingUser(null)}>
        {deactivatingUser && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{deactivatingUser.accountStatus === 'active' ? t.management.deactivate : t.management.activate}</DialogTitle>
              <DialogDescription>{t.management.confirmStatusChange.replace('{name}', deactivatingUser.fullName)}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeactivatingUser(null)}>{t.common.cancel}</Button>
              <Button variant={deactivatingUser.accountStatus === 'active' ? 'destructive' : 'default'} onClick={toggleStatus}>
                {deactivatingUser.accountStatus === 'active' ? t.management.deactivate : t.management.activate}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
