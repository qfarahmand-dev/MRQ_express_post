'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/common/page-header'
import { ShipmentReports } from '@/components/dashboard/shipment-reports'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import { useAuth } from '@/contexts/auth-context'

export function ReportsView() {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const officeId = user?.officeId ?? undefined
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null)

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExportType(format)
    try {
      const url = format === 'excel'
        ? `/api/export/excel?type=shipments${officeId ? `&office_id=${officeId}` : ''}`
        : `/api/export/pdf?type=shipments${officeId ? `&office_id=${officeId}` : ''}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `mrq_shipments_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Export failed', err)
    } finally {
      setExportType(null)
    }
  }

  return (
    <>
      <PageHeader title={t.dashboard.reportsTitle} description={t.dashboard.reportsDescription} />
      <ShipmentReports />
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t.dashboard.exportReports || 'Export Reports'}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            onClick={() => handleExport('excel')}
            disabled={exportType === 'excel'}
            className="flex items-center gap-2"
          >
            {exportType === 'excel' ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <Download className="mr-2" />
            )}
            {t.dashboard.exportExcel || 'Export Excel'}
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            disabled={exportType === 'pdf'}
            variant="outline"
            className="flex items-center gap-2"
          >
            {exportType === 'pdf' ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <FileText className="mr-2" />
            )}
            {t.dashboard.exportPdf || 'Export PDF'}
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
