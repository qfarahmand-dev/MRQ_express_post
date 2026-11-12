'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, PackagePlus, Search } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { DeleteShipmentDialog } from '@/components/shipments/delete-shipment-dialog'
import { ShipmentsTable } from '@/components/shipments/shipments-table'
import { StatusSelect } from '@/components/shipments/status-select'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/language-context'
import { useShipments } from '@/hooks/use-shipments'
import { formatNumber, interpolate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Shipment, ShipmentStatus } from '@/types/shipment'

const PAGE_SIZE = 8

export function ShipmentsList() {
  const { t, lang } = useLanguage()
  const { data, error, isLoading } = useShipments()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ShipmentStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState<Shipment | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data ?? []).filter((s) => {
      if (status !== 'all' && s.status !== status) return false
      if (!q) return true
      return [s.trackingNumber ?? '', s.sender.name, s.receiver.name].some((v) => v.toLowerCase().includes(q))
    })
  }, [data, query, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length)
  const n = (value: number) => formatNumber(value, lang)

  return (
    <>
      <PageHeader
        title={t.shipments.title}
        description={t.shipments.description}
        actions={
          <Link href="/dashboard/shipments/new" className={cn(buttonVariants({ size: 'lg' }), 'px-4')}>
            <PackagePlus aria-hidden="true" />
            {t.nav.newShipment}
          </Link>
        }
      />

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {t.common.unexpectedError}
        </p>
      )}

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder={t.shipments.searchPlaceholder}
              aria-label={t.shipments.searchLabel}
              className="h-10 ps-9"
            />
          </div>
          <StatusSelect<ShipmentStatus | 'all'>
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            allOption={{ value: 'all', label: t.shipments.allStatuses }}
            aria-label={t.shipments.statusFilterLabel}
            className="sm:w-56"
          />
        </div>

        <CardContent className="px-0">
          <ShipmentsTable shipments={pageItems} loading={isLoading} onDelete={setToDelete} />
        </CardContent>

        <div className="flex flex-col items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row">
          <p aria-live="polite">{interpolate(t.shipments.showing, { from: n(from), to: n(to), total: n(filtered.length) })}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
              <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
              {t.common.previous}
            </Button>
            <span className="px-1 text-xs">{interpolate(t.common.pageOf, { page: n(currentPage), total: n(totalPages) })}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>
              {t.common.next}
              <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      <DeleteShipmentDialog shipment={toDelete} onOpenChange={(open) => !open && setToDelete(null)} />
    </>
  )
}
