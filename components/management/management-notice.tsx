'use client'

import { Info } from 'lucide-react'

export function ManagementNotice({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-highlight/50 bg-highlight/10 px-4 py-3 text-sm leading-relaxed text-foreground">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}
