'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/language-context'
import { isValidEmail } from '@/lib/validation'
import { authService } from '@/services/auth-service'

type LoginErrors = { email?: string; password?: string }

export function LoginForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): LoginErrors {
    const next: LoginErrors = {}
    if (!email.trim()) next.email = t.login.errors.emailRequired
    else if (!isValidEmail(email)) next.email = t.login.errors.emailInvalid
    if (!password) next.password = t.login.errors.passwordRequired
    else if (password.length < 6) next.password = t.login.errors.passwordShort
    return next
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const result = await authService.signIn(email, password)
      if (result.ok) {
        router.push('/dashboard')
        return
      }
      setFormError(result.error === 'not_configured' ? t.login.errors.notConfigured : t.login.errors.invalidCredentials)
    } catch {
      setFormError(t.common.unexpectedError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{formError}</p>
        </div>
      )}

      <FormField id="email" label={t.login.email} error={errors.email}>
        <Input
          id="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          placeholder={t.login.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email) || undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="h-11 rtl:text-end"
        />
      </FormField>

      <FormField id="password" label={t.login.password} error={errors.password}>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors.password) || undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className="h-11 pe-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
            aria-pressed={showPassword}
            className="absolute end-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </FormField>

      <div className="flex items-center gap-2">
        <Checkbox id="remember" checked={remember} onCheckedChange={(checked) => setRemember(Boolean(checked))} />
        <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
          {t.login.remember}
        </Label>
      </div>

      <Button type="submit" disabled={submitting} className="h-11 text-sm font-semibold">
        {submitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            {t.login.submitting}
          </>
        ) : (
          t.login.submit
        )}
      </Button>

      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t.login.demoLink}
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
      </Link>
    </form>
  )
}
