'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/common/status-badge'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { formatDate, interpolate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Shipment } from '@/types/shipment'

interface ShipmentsTableProps {
  shipments: Shipment[]
  loading?: boolean
  compact?: boolean
  emptyMessage?: string
  onDelete?: (shipment: Shipment) => void
}

export function ShipmentsTable({ shipments, loading, compact, emptyMessage, onDelete }: ShipmentsTableProps) {
  const { t, lang } = useLanguage()
  const { can } = useAuth()
  const router = useRouter()
  const columnCount = compact ? 4 : 7

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/60 hover:bg-muted/60">
          <TableHead className="text-start">{t.shipments.columns.tracking}</TableHead>
          {!compact && <TableHead className="text-start">{t.shipments.columns.sender}</TableHead>}
          <TableHead className="text-start">{t.shipments.columns.receiver}</TableHead>
          {!compact && <TableHead className="text-start">{t.shipments.columns.packageType}</TableHead>}
          <TableHead className="text-start">{t.shipments.columns.status}</TableHead>
          <TableHead className="text-start">{t.shipments.columns.date}</TableHead>
          {!compact && (
            <TableHead className="text-end">
              <span className="sr-only">{t.shipments.columns.actions}</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={`skeleton-${i}`}>
              <TableCell colSpan={columnCount}>
                <div className="h-5 animate-pulse rounded bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        {!loading && shipments.length === 0 && (
          <TableRow>
            <TableCell colSpan={columnCount} className="py-10 text-center text-sm text-muted-foreground">
              {emptyMessage ?? t.shipments.empty}
            </TableCell>
          </TableRow>
        )}
        {!loading &&
          shipments.map((shipment) => (
            <TableRow key={shipment.id}>
              <TableCell className="text-start">
                <Link
                  href={`/dashboard/shipments/${shipment.id}`}
                  dir="ltr"
                  className="font-mono text-sm font-semibold text-primary hover:underline"
                >
                  {shipment.trackingNumber}
                </Link>
              </TableCell>
              {!compact && <TableCell className="text-start">{shipment.sender.name}</TableCell>}
              <TableCell className="text-start">{shipment.receiver.name}</TableCell>
              {!compact && (
                <TableCell className="text-start text-muted-foreground">{t.packageTypes[shipment.packageType]}</TableCell>
              )}
              <TableCell className="text-start">
                <StatusBadge status={shipment.status} />
              </TableCell>
              <TableCell className="text-start text-muted-foreground">{formatDate(shipment.registrationDate, lang)}</TableCell>
              {!compact && (
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                      aria-label={interpolate(t.shipments.openActions, { number: shipment.trackingNumber })}
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-40">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/shipments/${shipment.id}`)}>
                        <Eye aria-hidden="true" />
                        {t.common.view}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/shipments/${shipment.id}/edit`)}>
                        <Pencil aria-hidden="true" />
                        {t.common.edit}
                      </DropdownMenuItem>
                      {can('delete') && onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => onDelete(shipment)}>
                            <Trash2 aria-hidden="true" />
                            {t.common.delete}
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  )
}
