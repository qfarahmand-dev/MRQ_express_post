'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormField } from '@/components/common/form-field'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/language-context'
import { authService } from '@/services/auth-service'

type PasswordErrors = {
  current?: string
  next?: string
  confirmation?: string
}

export function ChangePasswordView() {
  const { t, lang } = useLanguage()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(true)

  function reset() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmation('')
    setErrors({})
    setFormError('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const nextErrors: PasswordErrors = {}
    if (!currentPassword) nextErrors.current = t.login.errors.passwordRequired
    if (newPassword.length < 6) nextErrors.next = t.login.errors.passwordShort
    if (confirmation !== newPassword) nextErrors.confirmation = t.profile.passwordMismatch
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      const result = await authService.updatePassword(currentPassword, newPassword)
      if (result.ok) {
        const clearResult = await authService.clearMustChangePassword()
        if (clearResult.ok) {
          toast.success(t.profile.passwordChanged)
          setIsFirstLogin(false)
          router.replace('/dashboard')
          router.refresh()
          return
        }
        setFormError(t.profile.passwordUpdateFailed)
        return
      }

      if (result.error === 'invalid_current_password') {
        setErrors({ current: t.profile.currentPasswordInvalid })
        return
      }
      setFormError(t.profile.passwordUpdateFailed)
    } catch {
      setFormError(t.profile.passwordUpdateFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-muted/30">
      <PageHeader
        title={t.profile.changePassword}
        description={isFirstLogin
          ? t.profile.changePasswordFirstLogin
          : t.profile.changePasswordDescription}
      />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {formError && (
                <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>{formError}</p>
                </div>
              )}

              <FormField id="current-password" label={t.profile.currentPassword} required error={errors.current}>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value)
                    setErrors((previous) => ({ ...previous, current: undefined }))
                  }}
                  className="h-10"
                  aria-invalid={Boolean(errors.current) || undefined}
                />
              </FormField>

              <FormField id="new-password" label={t.profile.newPassword} required error={errors.next}>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    setErrors((previous) => ({ ...previous, next: undefined }))
                  }}
                  className="h-10"
                  aria-invalid={Boolean(errors.next) || undefined}
                />
              </FormField>

              <FormField id="confirm-password" label={t.profile.confirmPassword} required error={errors.confirmation}>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => {
                    setConfirmation(event.target.value)
                    setErrors((previous) => ({ ...previous, confirmation: undefined }))
                  }}
                  className="h-10"
                  aria-invalid={Boolean(errors.confirmation) || undefined}
                />
              </FormField>

              <div className="pt-4">
                <Button type="submit" disabled={saving} className="w-full h-11">
                  {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {saving ? t.common.saving : t.profile.changePassword}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
