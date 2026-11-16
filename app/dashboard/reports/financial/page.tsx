import type { Metadata } from 'next'
import { FinancialReportsView } from '@/components/dashboard/financial-reports-view'

export const metadata: Metadata = { title: 'Financial Reports' }

export default function FinancialReportsPage() {
  return <FinancialReportsView />
}
