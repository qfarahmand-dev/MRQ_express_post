'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/language-context'
import { normalizeTrackingNumber } from '@/lib/validation'
import { cn } from '@/lib/utils'

interface TrackingSearchFormProps {
  defaultValue?: string
  size?: 'default' | 'large'
  className?: string
  resultPath?: string
}

export function TrackingSearchForm({ defaultValue = '', size = 'default', className, resultPath = '/track' }: TrackingSearchFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const number = normalizeTrackingNumber(value)
    if (!number) {
      setError(true)
      return
    }
    setError(false)
    router.push(`${resultPath}?number=${encodeURIComponent(number)}`)
  }

  const large = size === 'large'

  return (
    <form onSubmit={handleSubmit} noValidate className={cn('flex flex-col gap-2', className)}>
      <label htmlFor="tracking-number" className="sr-only">
        {t.home.trackLabel}
      </label>
      <div
        className={cn(
          'flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-sm sm:flex-row sm:items-center',
          error && 'border-destructive',
        )}
      >
        <div className="relative flex-1">
          <PackageSearch
            className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="tracking-number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t.home.trackPlaceholder}
            maxLength={40}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error || undefined}
            aria-describedby={error ? 'tracking-number-error' : undefined}
            className={cn(
              'border-0 bg-transparent ps-10 font-mono tracking-wide shadow-none focus-visible:ring-0 dark:bg-transparent',
              large ? 'h-12 text-base' : 'h-10',
            )}
          />
        </div>
        <Button
          type="submit"
          className={cn(
            'bg-highlight font-semibold text-highlight-foreground hover:bg-highlight/85',
            large ? 'h-12 px-6 text-base' : 'h-10 px-5',
          )}
        >
          {t.home.trackButton}
          <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
        </Button>
      </div>
      {error && (
        <p id="tracking-number-error" className="text-sm font-medium text-destructive">
          {t.track.emptyError}
        </p>
      )}
    </form>
  )
}
