import { shipmentOpsService, financialService, notificationService, warehouseService, officeOperationsService, shipmentIssuesService, shipmentTransfersService, auditService } from '@/services/warehouse-service'

export type ExportType = 'shipments' | 'warehouse-operations' | 'office-operations' | 'transfers' | 'issues' | 'audit-logs' | 'financial' | 'notifications'

export interface ExportOptions {
  type?: ExportType
  officeId?: string
  startDate?: string
  endDate?: string
}

async function getShipmentData(officeId?: string) {
  return shipmentOpsService.listShipments(officeId)
}

async function getWarehouseOperationData(officeId?: string) {
  return warehouseService.listWarehouseOperations(officeId)
}

async function getOfficeOperationData(officeId?: string) {
  return officeOperationsService.listOfficeOperations(officeId)
}

async function getTransferData(officeId?: string) {
  return shipmentTransfersService.listTransfers(officeId)
}

async function getIssueData(officeId?: string) {
  return shipmentIssuesService.listIssues(officeId)
}

async function getNotificationData(officeId?: string) {
  return notificationService.listNotifications(officeId)
}

async function getFinancialData(officeId?: string, startDate?: string, endDate?: string) {
  return financialService.listTransactions(officeId, startDate, endDate)
}

export async function generatePdfExport(options: ExportOptions): Promise<Buffer> {
  const { jsPDF } = require('jspdf')
  const doc = new jsPDF()

  const title = (options.type || 'shipments').charAt(0).toUpperCase() + (options.type || 'shipments').slice(1).replace(/-/g, ' ')
  doc.setFontSize(16)
  doc.text(`MRQ Express Post - ${title} Report`, 20, 20)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toISOString()}`, 20, 30)
  if (options.officeId) doc.text(`Office ID: ${options.officeId}`, 20, 38)
  if (options.startDate && options.endDate) doc.text(`Period: ${options.startDate} to ${options.endDate}`, 20, 46)

  let data: any[] = []
  let headers: string[] = []

  switch (options.type) {
    case 'shipments': {
      data = await getShipmentData(options.officeId)
      headers = ['Tracking Number', 'Office ID', 'Status', 'Destination Country', 'Receiver Name', 'Updated At']
      break
    }
    case 'warehouse-operations': {
      data = await getWarehouseOperationData(options.officeId)
      headers = ['Shipment ID', 'Operation Type', 'Previous Status', 'New Status', 'Location', 'Created At']
      break
    }
    case 'office-operations': {
      data = await getOfficeOperationData(options.officeId)
      headers = ['Shipment ID', 'Operation Type', 'Previous Status', 'New Status', 'Notes', 'Created At']
      break
    }
    case 'transfers': {
      data = await getTransferData(options.officeId)
      headers = ['Shipment ID', 'Source Office', 'Destination Office', 'State', 'Created At']
      break
    }
    case 'issues': {
      data = await getIssueData(options.officeId)
      headers = ['Shipment ID', 'Kind', 'Description', 'State', 'Created At']
      break
    }
    case 'notifications': {
      data = await getNotificationData(options.officeId)
      headers = ['Type', 'Title', 'Message', 'Priority', 'Is Read', 'Created At']
      break
    }
    case 'financial': {
      data = await getFinancialData(options.officeId, options.startDate, options.endDate)
      headers = ['Office ID', 'Type', 'Category', 'Amount', 'Currency', 'Description', 'Created At']
      break
    }
    case 'audit-logs': {
      data = await auditService.listAuditLogs(options.officeId)
      headers = ['Actor ID', 'Action', 'Entity Type', 'Entity ID', 'Office ID', 'Created At']
      break
    }
  }

  const tableData = data.map((row: any) =>
    headers.map((h) => {
      const key = h.toLowerCase().replace(/\s/g, '_')
      return row[key] ?? ''
    })
  )

  doc.autoTable({
    head: [headers],
    body: tableData,
    startY: 55,
    theme: 'striped',
    headStyles: { fillColor: [31, 78, 121] },
  })

  const buffer = doc.output('arraybuffer')
  return Buffer.from(buffer)
}

export function getExportFilename(type: ExportType, options?: ExportOptions): string {
  const date = new Date().toISOString().split('T')[0]
  const officeSuffix = options?.officeId ? `_office_${options.officeId}` : ''
  const dateSuffix = options?.startDate && options?.endDate ? `_${options.startDate}_to_${options.endDate}` : ''
  return `mrq_${type}_${date}${officeSuffix}${dateSuffix}.pdf`
}
