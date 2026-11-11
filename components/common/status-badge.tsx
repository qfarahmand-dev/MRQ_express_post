'use client'

import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import type { ShipmentStatus } from '@/types/shipment'

export const statusStyles: Record<ShipmentStatus, { badge: string; dot: string }> = {
  registered: { badge: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-500' },
  in_warehouse: { badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dot: 'bg-indigo-500' },
  dispatched: { badge: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  in_transit: { badge: 'bg-blue-50 text-[#0f2a71] ring-blue-200', dot: 'bg-[#0f2a71]' },
  out_for_delivery: { badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-[#fecf07]' },
  delivered: { badge: 'bg-green-50 text-green-700 ring-green-200', dot: 'bg-[#16a34a]' },
  delayed: { badge: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500' },
  returned: { badge: 'bg-purple-50 text-purple-700 ring-purple-200', dot: 'bg-purple-500' },
  cancelled: { badge: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-[#dc2626]' },
}

export function StatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  const { t } = useLanguage()
  const style = statusStyles[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        style.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden="true" />
      {t.statuses[status]}
    </span>
  )
}
