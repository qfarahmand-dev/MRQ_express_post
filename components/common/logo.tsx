import Link from 'next/link'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string
  variant?: 'dark' | 'light'
  className?: string
}

export function Logo({ href = '/', variant = 'dark', className }: LogoProps) {
  return (
    <Link
      href={href}
      dir="ltr"
      className={cn('inline-flex items-center gap-2.5 rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 outline-none', className)}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-highlight text-highlight-foreground">
        <Send className="size-4.5 -rotate-12" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn('text-base font-extrabold tracking-tight', variant === 'dark' ? 'text-primary' : 'text-white')}>
          MRQ
        </span>
        <span
          className={cn(
            'text-[0.65rem] font-semibold uppercase tracking-[0.18em]',
            variant === 'dark' ? 'text-muted-foreground' : 'text-white/70',
          )}
        >
          Express Post
        </span>
      </span>
    </Link>
  )
}
