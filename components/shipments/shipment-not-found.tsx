'use client'

import Link from 'next/link'
import { ArrowLeft, PackageX } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'

export function ShipmentNotFound() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <PackageX className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold">{t.shipments.notFoundTitle}</h1>
      <p className="text-sm text-muted-foreground">{t.shipments.notFoundDescription}</p>
      <Link href="/dashboard/shipments" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'mt-2 px-4')}>
        <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
        {t.shipments.backToList}
      </Link>
    </div>
  )
}

export function ShipmentLoading() {
  const { t } = useLanguage()
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">{t.common.loading}</span>
      <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-xl bg-muted lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}
