'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Lock, Pencil, X } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { PageHeader } from '@/components/common/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { formatDate, initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { isValidEmail } from '@/lib/validation'
import { ROLE_PERMISSIONS, type AppUser, type Permission } from '@/types/user'

const ALL_PERMISSIONS: Permission[] = ['view', 'create', 'edit', 'delete', 'updateStatus']

function EditProfileDialog({ user, open, onOpenChange }: { user: AppUser; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useLanguage()
  const { updateProfile } = useAuth()
  const [fullName, setFullName] = useState(user.fullName)
  const [email, setEmail] = useState(user.email)
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: typeof errors = {}
    if (!fullName.trim()) next.fullName = t.form.errors.required
    if (!email.trim()) next.email = t.login.errors.emailRequired
    else if (!isValidEmail(email)) next.email = t.login.errors.emailInvalid
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      await updateProfile({ fullName, email })
      toast.success(t.profile.saved)
      onOpenChange(false)
    } catch {
      toast.error(t.common.unexpectedError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{t.profile.edit}</DialogTitle>
            <DialogDescription>{t.profile.editDescription}</DialogDescription>
          </DialogHeader>
          <FormField id="profile-name" label={t.profile.fullName} required error={errors.fullName}>
            <Input
              id="profile-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="h-10"
              aria-invalid={Boolean(errors.fullName) || undefined}
            />
          </FormField>
          <FormField id="profile-email" label={t.profile.email} required error={errors.email}>
            <Input
              id="profile-email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-10 rtl:text-end"
              aria-invalid={Boolean(errors.email) || undefined}
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ProfileView() {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)

  if (!user) return <div className="h-64 animate-pulse rounded-xl bg-muted" />

  const granted = ROLE_PERMISSIONS[user.role]
  const fields = [
    { label: t.profile.fullName, value: user.fullName },
    { label: t.profile.email, value: user.email, ltr: true },
    { label: t.profile.role, value: t.roles[user.role] },
    { label: t.profile.memberSince, value: formatDate(user.createdAt, lang) },
  ]

  return (
    <>
      <PageHeader
        title={t.profile.title}
        description={t.profile.description}
        actions={
          <Button size="lg" className="px-4" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" />
            {t.profile.edit}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                <AvatarFallback className="bg-primary text-2xl font-bold text-highlight">{initials(user.fullName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <p className="text-xl font-bold text-foreground">{user.fullName}</p>
                <span className="inline-flex self-start rounded-full bg-highlight/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {t.roles[user.role]}
                </span>
              </div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.label} className="flex flex-col gap-1 rounded-lg border p-4">
                  <dt className="text-xs text-muted-foreground">{field.label}</dt>
                  <dd dir={field.ltr ? 'ltr' : undefined} className="text-sm font-medium text-foreground rtl:text-end">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {t.profile.roleNote}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.profile.permissions}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {ALL_PERMISSIONS.map((permission) => {
                const allowed = granted.includes(permission)
                return (
                  <li key={permission} className={cn('flex items-center gap-2.5 text-sm', allowed ? 'text-foreground' : 'text-muted-foreground line-through')}>
                    <span
                      className={cn(
                        'flex size-5 items-center justify-center rounded-full',
                        allowed ? 'bg-green-50 text-success' : 'bg-red-50 text-destructive',
                      )}
                    >
                      {allowed ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
                    </span>
                    {t.profile.permissionLabels[permission]}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {editing && <EditProfileDialog user={user} open={editing} onOpenChange={setEditing} />}
    </>
  )
}
