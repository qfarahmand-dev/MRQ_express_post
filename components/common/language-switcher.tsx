'use client'

import { Languages } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import type { Language } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const options: { value: Language; label: string; lang: string }[] = [
  { value: 'en', label: 'EN', lang: 'en' },
  { value: 'fa', label: 'فا', lang: 'fa' },
]

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage()

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={cn('inline-flex items-center gap-0.5 rounded-lg border bg-card p-0.5', className)}
    >
      <Languages className="mx-1.5 size-4 text-muted-foreground" aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.lang}
          aria-pressed={lang === option.value}
          onClick={() => setLang(option.value)}
          className={cn(
            'h-7 min-w-9 rounded-md px-2 text-xs font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
            lang === option.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
