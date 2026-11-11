'use client'

import { statusStyles } from '@/components/common/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import { SHIPMENT_STATUSES, type ShipmentStatus } from '@/types/shipment'

interface StatusSelectProps<T extends string> {
  id?: string
  value: T
  onChange: (value: T) => void
  allOption?: { value: T; label: string }
  className?: string
  'aria-label'?: string
}

export function StatusSelect<T extends string = ShipmentStatus>({
  id,
  value,
  onChange,
  allOption,
  className,
  'aria-label': ariaLabel,
}: StatusSelectProps<T>) {
  const { t } = useLanguage()
  const items = [
    ...(allOption ? [allOption] : []),
    ...SHIPMENT_STATUSES.map((status) => ({ value: status as string as T, label: t.statuses[status] })),
  ]

  return (
    <Select items={items} value={value} onValueChange={(next) => next !== null && onChange(next as T)}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn('h-10 w-full', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.value in statusStyles && (
              <span
                className={cn('size-2 rounded-full', statusStyles[item.value as ShipmentStatus].dot)}
                aria-hidden="true"
              />
            )}
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
