'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Filter, Clock, Package, ArrowRightLeft, CircleAlert } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { searchService } from '@/services/warehouse-service'
import { formatDateTime } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AdvancedSearchView() {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const officeId = user?.officeId ?? undefined

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [results, setResults] = useState<Array<{
    id: string
    trackingNumber: string | null
    status: string
    destinationCountry: string
    receiverName: string
    officeId: string | null
    updatedAt: string
    source: 'shipment' | 'transfer' | 'issue'
  }>>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async () => {
    if (!query.trim() && !statusFilter && !officeId && !startDate && !endDate) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const data = await searchService.search({
        query: query.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        officeId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        source: sourceFilter === 'all' ? undefined : sourceFilter as 'shipment' | 'transfer' | 'issue',
      })
      setResults(data)
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      setLoading(false)
    }
  }, [query, statusFilter, officeId, startDate, endDate, sourceFilter])

  useEffect(() => {
    search()
  }, [search])

  const sourceLabel: Record<string, string> = {
    shipment: 'Shipment',
    transfer: 'Transfer',
    issue: 'Issue',
  }

  const visibleResults = useMemo(() => {
    return results
  }, [results])

  const statuses = ['registered', 'in_warehouse', 'dispatched', 'in_transit', 'delivered', 'problem']

  if (loading) {
    return (
      <>
        <PageHeader title={t.nav.advancedSearch || 'Advanced Search'} description={t.nav.searchDescription || 'Search shipments, transfers, and issues'} />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={t.nav.advancedSearch || 'Advanced Search'}
        description={t.nav.searchDescription || 'Search shipments, transfers, and issues with filters'}
      />

      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-4 space-y-2">
            <Label htmlFor="search-query">{t.nav.searchQuery || 'Search Query'}</Label>
            <Input
              id="search-query"
              placeholder={t.nav.enterTrackingNumber || 'Enter tracking number...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="status-filter">{t.nav.filterStatus || 'Status'}</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? 'all')}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder={t.nav.allStatuses || 'All statuses'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.nav.allStatuses || 'All statuses'}</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="source-filter">{t.nav.sourceType || 'Source Type'}</Label>
            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value ?? 'all')}>
              <SelectTrigger id="source-filter">
                <SelectValue placeholder={t.nav.allSources || 'All sources'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.nav.allSources || 'All sources'}</SelectItem>
                <SelectItem value="shipment">{t.nav.shipment || 'Shipment'}</SelectItem>
                <SelectItem value="transfer">{t.nav.transfer || 'Transfer'}</SelectItem>
                <SelectItem value="issue">{t.nav.issue || 'Issue'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="start-date">{t.nav.fromDate || 'From Date'}</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="end-date">{t.nav.toDate || 'To Date'}</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button onClick={search} className="w-full">
              <Search className="mr-2" />{t.nav.search || 'Search'}
            </Button>
          </div>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t.nav.searchResults || 'Search Results'}</CardTitle>
              <span className="text-sm text-muted-foreground">{visibleResults.length} {t.nav.resultsFound || 'results found'}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.nav.trackingNumber || 'Tracking Number'}</TableHead>
                    <TableHead>{t.nav.type || 'Type'}</TableHead>
                    <TableHead>{t.nav.status || 'Status'}</TableHead>
                    <TableHead>{t.nav.destination || 'Destination'}</TableHead>
                    <TableHead>{t.nav.recipient || 'Recipient'}</TableHead>
                    <TableHead>{t.nav.updatedAt || 'Updated At'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleResults.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.trackingNumber}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {r.source === 'shipment' && <Package className="size-3.5" />}
                          {r.source === 'transfer' && <ArrowRightLeft className="size-3.5" />}
                          {r.source === 'issue' && <CircleAlert className="size-3.5" />}
                          {sourceLabel[r.source]}
                        </span>
                      </TableCell>
                      <TableCell>{r.status}</TableCell>
                      <TableCell>{r.destinationCountry || '-'}</TableCell>
                      <TableCell>{r.receiverName || '-'}</TableCell>
                      <TableCell>{formatDateTime(r.updatedAt, lang)}</TableCell>
                    </TableRow>
                  ))}
                  {visibleResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                        {t.nav.noResults || 'No results found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
