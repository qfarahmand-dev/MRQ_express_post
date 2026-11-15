'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { Logo } from '@/components/common/logo'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/language-context'
import { getSupabaseClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function InviteCompletionView() {
  const { t, dir } = useLanguage()
  const router = useRouter()
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let active = true
    async function verifyInviteSession() {
      const supabase = getSupabaseClient()
      if (!supabase) {
        if (active) {
          setErrorMessage(t.invite.errors.notConfigured)
          setIsCheckingSession(false)
        }
        return
      }

      const hasInvalidLink = new URLSearchParams(window.location.search).get('error') === 'invalid_link'
      const { data, error } = await supabase.auth.getUser()
      if (!active) return
      setHasValidSession(!hasInvalidLink && !error && Boolean(data.user))
      if (hasInvalidLink || error || !data.user) setErrorMessage(t.invite.errors.invalidLink)
      setIsCheckingSession(false)
    }

    void verifyInviteSession()
    return () => { active = false }
  }, [t.invite.errors.invalidLink, t.invite.errors.notConfigured])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    if (password.length < 6) {
      setErrorMessage(t.invite.errors.passwordShort)
      return
    }
    if (password !== confirmation) {
      setErrorMessage(t.invite.errors.passwordMismatch)
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      setErrorMessage(t.invite.errors.notConfigured)
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setErrorMessage(t.invite.errors.saveFailed)
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setErrorMessage(t.invite.errors.saveFailed)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main dir={dir} className="flex min-h-dvh flex-col bg-muted/30">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Logo />
        <LanguageSwitcher />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">
              {t.invite.title}
            </CardTitle>
            <CardDescription>{t.invite.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {isCheckingSession ? (
              <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {t.common.loading}
              </p>
            ) : hasValidSession ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {errorMessage && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{errorMessage}</p>
                  </div>
                )}
                <FormField id="invite-password" label={t.invite.password} required hint={t.invite.passwordHint}>
                  <Input
                    id="invite-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-11"
                  />
                </FormField>
                <FormField id="invite-password-confirm" label={t.invite.confirmPassword} required>
                  <Input
                    id="invite-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    required
                    className="h-11"
                  />
                </FormField>
                <Button type="submit" disabled={isSaving} className="h-11 font-semibold">
                  {isSaving && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {isSaving ? t.common.saving : t.invite.submit}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>{errorMessage || t.invite.errors.invalidLink}</p>
                </div>
                <p className="text-sm text-muted-foreground">{t.invite.requestNewLink}</p>
                <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'h-10')}>
                  {t.login.submit}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
