'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

export function UnauthorizedAccess() {
  const { t } = useLanguage()

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center shadow-sm sm:p-10">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{t.nav.unauthorizedAccess}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.nav.unauthorizedAccessDescription}</p>
      </div>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: 'outline' }))}>
        <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
        {t.nav.dashboard}
      </Link>
    </section>
  )
}
