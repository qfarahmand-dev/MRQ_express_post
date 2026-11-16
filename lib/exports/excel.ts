import ExcelJS from 'exceljs'
import { shipmentOpsService, financialService, notificationService, warehouseService, officeOperationsService, shipmentIssuesService, shipmentTransfersService, auditService } from '@/services/warehouse-service'
import { getSupabaseClient } from '@/lib/supabase'

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

export async function generateExcelExport(options: ExportOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MRQ Express Post'
  workbook.modified = new Date()
  workbook.created = new Date()

  const sheetName = (options.type || 'shipments').charAt(0).toUpperCase() + (options.type || 'shipments').slice(1)
  const worksheet = workbook.addWorksheet(sheetName)

  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  }

  const dateStyle = { numFormat: 'yyyy-mm-dd hh:mm:ss' }

  let data: any[] = []
  let headers: string[] = []

  switch (options.type) {
    case 'shipments': {
      data = await getShipmentData(options.officeId)
      headers = ['ID', 'Tracking Number', 'Office ID', 'Status', 'Destination Country', 'Receiver Name', 'Created At', 'Updated At']
      break
    }
    case 'warehouse-operations': {
      data = await getWarehouseOperationData(options.officeId)
      headers = ['ID', 'Shipment ID', 'Warehouse ID', 'Office ID', 'Operation Type', 'Previous Status', 'New Status', 'Location', 'Notes', 'Created By', 'Created At']
      break
    }
    case 'office-operations': {
      data = await getOfficeOperationData(options.officeId)
      headers = ['ID', 'Shipment ID', 'Source Office ID', 'Destination Office ID', 'Office ID', 'Operation Type', 'Previous Status', 'New Status', 'Notes', 'Created By', 'Created At']
      break
    }
    case 'transfers': {
      data = await getTransferData(options.officeId)
      headers = ['ID', 'Shipment ID', 'Source Office ID', 'Destination Office ID', 'Office ID', 'State', 'Note', 'Created By', 'Received By', 'Created At', 'Received At']
      break
    }
    case 'issues': {
      data = await getIssueData(options.officeId)
      headers = ['ID', 'Shipment ID', 'Office ID', 'Kind', 'Description', 'State', 'Created By', 'Resolved By', 'Created At', 'Resolved At']
      break
    }
    case 'notifications': {
      data = await getNotificationData(options.officeId)
      headers = ['ID', 'User ID', 'Type', 'Title', 'Message', 'Entity Type', 'Entity ID', 'Office ID', 'Priority', 'Is Read', 'Read At', 'Created At']
      break
    }
    case 'financial': {
      data = await getFinancialData(options.officeId, options.startDate, options.endDate)
      headers = ['ID', 'Office ID', 'Type', 'Category', 'Amount', 'Currency', 'Description', 'Reference Type', 'Reference ID', 'Created By', 'Created At']
      break
    }
    case 'audit-logs': {
      data = await auditService.listAuditLogs(options.officeId)
      headers = ['ID', 'Actor ID', 'Action', 'Entity Type', 'Entity ID', 'Office ID', 'Previous Values', 'New Values', 'Metadata', 'Created At']
      break
    }
  }

  worksheet.columns = headers.map((h) => ({ header: h, key: h.toLowerCase().replace(/\s/g, '_'), width: 30 }))

  worksheet.getRow(1).eachCell((cell: ExcelJS.Cell) => {
    Object.assign(cell, headerStyle)
  })

  data.forEach((row: any) => {
    const newRow: any = {}
    headers.forEach((h) => {
      const key = h.toLowerCase().replace(/\s/g, '_')
      let value = row[key]
      if (value === null || value === undefined) value = ''
      if (key.includes('created_at') || key.includes('updated_at') || key.includes('read_at') || key.includes('received_at')) {
        newRow[key] = value
        newRow[key] = { ...newRow[key], ...dateStyle } as any
      } else {
        newRow[key] = value
      }
    })
    worksheet.addRow(newRow)
  })

  worksheet.getColumn('amount').eachCell((cell: ExcelJS.Cell, rowNumber: number) => {
    if (rowNumber > 1 && cell.value !== null && cell.value !== undefined && cell.value !== '') {
      cell.numFmt = '#,##0.00'
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export function getExportFilename(type: ExportType, options?: ExportOptions): string {
  const date = new Date().toISOString().split('T')[0]
  const officeSuffix = options?.officeId ? `_office_${options.officeId}` : ''
  const dateSuffix = options?.startDate && options?.endDate ? `_${options.startDate}_to_${options.endDate}` : ''
  return `mrq_${type}_${date}${officeSuffix}${dateSuffix}.xlsx`
}
