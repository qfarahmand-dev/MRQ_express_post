'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { financialService } from '@/services/warehouse-service'
import { formatDateTime } from '@/lib/format'

export function FinancialReportsView() {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const officeId = user?.officeId ?? undefined

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [summary, setSummary] = useState<{
    totalRevenue: number
    totalExpense: number
    netBalance: number
    transactionCount: number
  } | null>(null)
  const [transactions, setTransactions] = useState<Array<{
    id: string
    officeId: string
    type: string
    category: string
    amount: number
    currency: string
    description: string
    createdAt: string
    createdBy: string
  }>>([])
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  useEffect(() => {
    setStartDate(monthStart)
    setEndDate(today)
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    if (!officeId || !startDate || !endDate) return
    setLoading(true)
    try {
      const [summaryResult, transactionsResult] = await Promise.all([
        financialService.getSummary(officeId, startDate, endDate),
        financialService.listTransactions(officeId, startDate, endDate),
      ])
      setSummary(summaryResult)
      setTransactions(transactionsResult)
    } catch (err) {
      console.error('Failed to load financial data', err)
    } finally {
      setLoading(false)
    }
  }, [officeId, startDate, endDate])

  const typeLabel: Record<string, string> = {
    revenue: t.financial?.totalRevenue || 'Revenue',
    expense: t.financial?.totalExpense || 'Expense',
  }

  if (loading) {
    return (
      <>
        <PageHeader title={t.financial?.title || 'Financial Reports'} description={t.financial?.description || 'View financial reports and transaction history'} />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={t.financial?.title || 'Financial Reports'}
        description={t.financial?.description || 'View financial reports and transaction history'}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">{t.financial?.totalRevenue || 'Total Revenue'}</CardTitle>
            <CardDescription>{summary ? `${summary.totalRevenue.toFixed(2)} AFN` : '--'}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">{t.financial?.totalExpense || 'Total Expenses'}</CardTitle>
            <CardDescription>{summary ? `${summary.totalExpense.toFixed(2)} AFN` : '--'}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">{t.financial?.netBalance || 'Net Balance'}</CardTitle>
            <CardDescription className={summary?.netBalance! >= 0 ? 'text-foreground' : 'text-destructive'}>
              {summary ? `${summary.netBalance.toFixed(2)} AFN` : '--'}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">{t.financial?.transactionCount || 'Transactions'}</CardTitle>
            <CardDescription>{summary ? summary.transactionCount : '--'}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{t.financial?.dateRange || 'Date Range'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t.financial?.fromDate || 'From Date'}</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t.financial?.toDate || 'To Date'}</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <Button onClick={loadData} disabled={!officeId}>
              {t.financial?.applyFilter || 'Apply Filter'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.financial?.transactions || 'Recent Transactions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeader>{t.financial?.date || 'Date'}</TableHeader>
                    <TableHeader>{t.financial?.type || 'Type'}</TableHeader>
                    <TableHeader>{t.financial?.category || 'Category'}</TableHeader>
                    <TableHeader>{t.financial?.amount || 'Amount'}</TableHeader>
                    <TableHeader>{t.financial?.description || 'Description'}</TableHeader>
                    <TableHeader>{t.financial?.recordedBy || 'Recorded By'}</TableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDateTime(tx.createdAt, lang)}</TableCell>
                      <TableCell>{typeLabel[tx.type] || tx.type}</TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.amount.toFixed(2)} {tx.currency}
                      </TableCell>
                      <TableCell className="text-xs">{tx.description}</TableCell>
                      <TableCell className="text-xs">{tx.createdBy}</TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        {t.financial?.noTransactions || 'No financial transactions found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {summary && summary.transactionCount === 0 && (
        <Card className="mt-4">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            {t.financial?.noDataNotice || 'No financial data available yet. Financial reports will appear once transactions are recorded.'}
          </CardContent>
        </Card>
      )}
    </>
  )
}
