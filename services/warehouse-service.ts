import { getSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { ShipmentStatus } from '@/types/shipment'
import type {
  IssueKind,
  IssueState,
  OfficeOperationType,
  TransferState,
  WarehouseOperationType,
} from '@/types/database'

type WarehouseRow = Database['public']['Tables']['warehouses']['Row']
type WarehouseOperationRow = Database['public']['Tables']['warehouse_operations']['Row']
type OfficeOperationRow = Database['public']['Tables']['office_operations']['Row']

function getClient() {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase is not configured')
  return client
}

export type WarehouseInfo = {
  id: string
  name: string
  code: string
  officeId: string
  address: string
  phone: string
  email: string
  status: string
  createdAt: string
  updatedAt: string
}

export type WarehouseOperation = {
  id: string
  shipmentId: string
  warehouseId: string
  officeId: string
  operationType: WarehouseOperationType
  previousStatus: string | null
  newStatus: string
  location: string | null
  notes: string | null
  createdBy: string
  createdAt: string
}

export type OfficeOperation = {
  id: string
  shipmentId: string | null
  sourceOfficeId: string | null
  destinationOfficeId: string | null
  officeId: string
  operationType: OfficeOperationType
  previousStatus: string | null
  newStatus: string | null
  notes: string | null
  createdBy: string
  createdAt: string
}

export type ShipmentIssue = {
  id: string
  shipmentId: string
  officeId: string
  kind: IssueKind
  description: string
  state: IssueState
  createdBy: string
  resolvedBy: string | null
  createdAt: string
  resolvedAt: string | null
}

export type ShipmentTransfer = {
  id: string
  shipmentId: string
  sourceOfficeId: string
  destinationOfficeId: string
  officeId: string
  state: TransferState
  note: string | null
  createdBy: string
  receivedBy: string | null
  createdAt: string
  receivedAt: string | null
}

function mapWarehouse(row: WarehouseRow): WarehouseInfo {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    officeId: row.office_id,
    address: row.address,
    phone: row.phone,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapWarehouseOperation(row: WarehouseOperationRow): WarehouseOperation {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    warehouseId: row.warehouse_id,
    officeId: row.office_id,
    operationType: row.operation_type,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    location: row.location,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

function mapOfficeOperation(row: OfficeOperationRow): OfficeOperation {
  return {
    id: row.id,
    shipmentId: row.shipment_id,
    sourceOfficeId: row.source_office_id,
    destinationOfficeId: row.destination_office_id,
    officeId: row.office_id,
    operationType: row.operation_type,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

export const warehouseService = {
  async listWarehouses(): Promise<WarehouseInfo[]> {
    const client = getClient()
    const { data, error } = await client
      .from('warehouses')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapWarehouse)
  },

  async getWarehouse(id: string): Promise<WarehouseInfo | null> {
    const client = getClient()
    const { data, error } = await client
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapWarehouse(data)
  },

  async receiveShipment(shipmentId: string, warehouseId: string, location?: string, note?: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client.rpc('warehouse_receive_shipment', {
      p_shipment_id: shipmentId,
      p_warehouse_id: warehouseId,
      p_location: location ?? '',
      p_note: note ?? '',
    })
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the operation id')
    return data
  },

  async dispatchShipment(shipmentId: string, warehouseId: string, location?: string, note?: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client.rpc('warehouse_dispatch_shipment', {
      p_shipment_id: shipmentId,
      p_warehouse_id: warehouseId,
      p_location: location ?? '',
      p_note: note ?? '',
    })
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the operation id')
    return data
  },

  async recordStorageLocation(shipmentId: string, warehouseId: string, location: string, note?: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client.rpc('warehouse_record_storage_location', {
      p_shipment_id: shipmentId,
      p_warehouse_id: warehouseId,
      p_location: location,
      p_note: note ?? '',
    })
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the operation id')
    return data
  },

  async listWarehouseOperations(warehouseId?: string): Promise<WarehouseOperation[]> {
    const client = getClient()
    let query = client.from('warehouse_operations').select('*').order('created_at', { ascending: false })
    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(mapWarehouseOperation)
  },
}

export const officeOperationsService = {
  async registerIncoming(shipmentId: string, officeId: string, note?: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client.rpc('office_register_incoming', {
      p_shipment_id: shipmentId,
      p_office_id: officeId,
      p_note: note ?? '',
    })
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the operation id')
    return data
  },

  async registerOutgoing(shipmentId: string, officeId: string, destinationOfficeId: string, note?: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client.rpc('office_register_outgoing', {
      p_shipment_id: shipmentId,
      p_office_id: officeId,
      p_destination_office_id: destinationOfficeId,
      p_note: note ?? '',
    })
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the operation id')
    return data
  },

  async transferShipment(shipmentId: string, sourceOfficeId: string, destinationOfficeId: string, note?: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client.rpc('office_transfer_shipment', {
      p_shipment_id: shipmentId,
      p_source_office_id: sourceOfficeId,
      p_destination_office_id: destinationOfficeId,
      p_note: note ?? '',
    })
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the operation id')
    return data
  },

  async recordHandover(shipmentId: string, sourceOfficeId: string, destinationOfficeId: string, note?: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client.rpc('office_record_handover', {
      p_shipment_id: shipmentId,
      p_source_office_id: sourceOfficeId,
      p_destination_office_id: destinationOfficeId,
      p_note: note ?? '',
    })
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the operation id')
    return data
  },

  async listOfficeOperations(officeId?: string): Promise<OfficeOperation[]> {
    const client = getClient()
    let query = client.from('office_operations').select('*').order('created_at', { ascending: false })
    if (officeId) {
      query = query.eq('office_id', officeId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(mapOfficeOperation)
  },
}

export const shipmentIssuesService = {
  async reportIssue(shipmentId: string, officeId: string, kind: IssueKind, description: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client.rpc('report_shipment_issue', {
      p_shipment_id: shipmentId,
      p_office_id: officeId,
      p_kind: kind,
      p_description: description,
    })
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the issue id')
    return data
  },

  async resolveIssue(issueId: string, officeId: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client.rpc('resolve_shipment_issue', {
      p_issue_id: issueId,
      p_office_id: officeId,
    })
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the issue id')
    return data
  },

  async listIssues(officeId?: string): Promise<ShipmentIssue[]> {
    const client = getClient()
    let query = client.from('shipment_issues').select('*').order('created_at', { ascending: false })
    if (officeId) {
      query = query.eq('office_id', officeId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id,
      shipmentId: row.shipment_id,
      officeId: row.office_id,
      kind: row.kind,
      description: row.description,
      state: row.state,
      createdBy: row.created_by,
      resolvedBy: row.resolved_by,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    }))
  },
}

export const shipmentTransfersService = {
  async listTransfers(officeId?: string): Promise<ShipmentTransfer[]> {
    const client = getClient()
    let query = client.from('shipment_transfers').select('*').order('created_at', { ascending: false })
    if (officeId) {
      query = query.eq('office_id', officeId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id,
      shipmentId: row.shipment_id,
      sourceOfficeId: row.source_office_id,
      destinationOfficeId: row.destination_office_id,
      officeId: row.office_id,
      state: row.state,
      note: row.note,
      createdBy: row.created_by,
      receivedBy: row.received_by,
      createdAt: row.created_at,
      receivedAt: row.received_at,
    }))
  },
}

export const auditService = {
  async listAuditLogs(officeId?: string): Promise<Array<{
    id: string
    actorId: string
    action: string
    entityType: string
    entityId: string
    officeId: string | null
    previousValues: Json | null
    newValues: Json | null
    metadata: Json | null
    createdAt: string
  }>> {
    const client = getClient()
    let query = client.from('audit_logs').select('*').order('created_at', { ascending: false })
    if (officeId) {
      query = query.eq('office_id', officeId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      officeId: row.office_id,
      previousValues: row.previous_values,
      newValues: row.new_values,
      metadata: row.metadata,
      createdAt: row.created_at,
    }))
  },
}

export type ShipmentSummary = {
  id: string
  trackingNumber: string | null
  officeId: string | null
  status: string
  destinationCountry: string
  receiverName: string
  createdAt: string
  updatedAt: string
}

export const shipmentOpsService = {
  async listShipments(officeId?: string, status?: string): Promise<ShipmentSummary[]> {
    const client = getClient()
    let query = client
      .from('shipments')
      .select('id, tracking_number, office_id, status, destination_country, receiver_name, created_at, updated_at')
      .order('updated_at', { ascending: false })
    if (officeId) {
      query = query.eq('office_id', officeId)
    }
    if (status) {
      query = query.eq('status', status as ShipmentStatus)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id,
      trackingNumber: row.tracking_number,
      officeId: row.office_id,
      status: row.status,
      destinationCountry: row.destination_country,
      receiverName: row.receiver_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  },

  async getShipmentByTrackingNumber(trackingNumber: string): Promise<ShipmentSummary | null> {
    const client = getClient()
    const { data, error } = await client
      .from('shipments')
      .select('id, tracking_number, office_id, status, destination_country, receiver_name, created_at, updated_at')
      .eq('tracking_number', trackingNumber.toUpperCase())
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return {
      id: data.id,
      trackingNumber: data.tracking_number,
      officeId: data.office_id,
      status: data.status,
      destinationCountry: data.destination_country,
      receiverName: data.receiver_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },
}

export type Notification = {
  id: string
  userId: string
  type: string
  title: string
  message: string
  entityType: string | null
  entityId: string | null
  officeId: string | null
  priority: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export type FinancialTransaction = {
  id: string
  officeId: string
  type: string
  category: string
  amount: number
  currency: string
  description: string
  referenceType: string | null
  referenceId: string | null
  createdBy: string
  createdAt: string
}

export type FinancialSummary = {
  totalRevenue: number
  totalExpense: number
  netBalance: number
  transactionCount: number
}

export const notificationService = {
  async listNotifications(officeId?: string, unreadOnly?: boolean): Promise<Notification[]> {
    const client = getClient()
    let query = client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }
    if (officeId) {
      query = query.eq('office_id', officeId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      entityType: row.entity_type,
      entityId: row.entity_id,
      officeId: row.office_id,
      priority: row.priority,
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
    }))
  },

  async getUnreadCount(): Promise<number> {
    const client = getClient()
    const { count, error } = await client
      .from('notifications')
      .select('*', { head: true, count: 'exact' })
      .eq('is_read', false)
    if (error) throw error
    return count ?? 0
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const client = getClient()
    const { error } = await client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
    if (error) throw error
  },

  async markAllNotificationsAsRead(): Promise<void> {
    const client = getClient()
    const { error } = await client
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('is_read', false)
    if (error) throw error
  },
}

export const financialService = {
  async listTransactions(officeId?: string, startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    const client = getClient()
    let query = client
      .from('financial_transactions')
      .select('*')
      .order('created_at', { ascending: false })
    if (officeId) {
      query = query.eq('office_id', officeId)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id,
      officeId: row.office_id,
      type: row.type,
      category: row.category,
      amount: Number(row.amount),
      currency: row.currency,
      description: row.description,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }))
  },

  async getSummary(officeId: string, startDate: string, endDate: string): Promise<FinancialSummary> {
    const client = getClient()
    const { data, error } = await client.rpc('get_financial_summary', {
      p_office_id: officeId,
      p_start_date: startDate,
      p_end_date: endDate,
    })
    if (error) throw error
    if (!data || data.length === 0) {
      return { totalRevenue: 0, totalExpense: 0, netBalance: 0, transactionCount: 0 }
    }
    const row = data[0]
    return {
      totalRevenue: Number(row.total_revenue ?? 0),
      totalExpense: Number(row.total_expense ?? 0),
      netBalance: Number(row.net_balance ?? 0),
      transactionCount: Number(row.transaction_count ?? 0),
    }
  },

  async createTransaction(officeId: string, type: string, category: string, amount: number, currency: string, description: string, createdBy: string, referenceType?: string, referenceId?: string): Promise<string> {
    const client = getClient()
    const { data, error } = await client
      .from('financial_transactions')
      .insert({
        office_id: officeId,
        type,
        category,
        amount,
        currency,
        description,
        reference_type: referenceType ?? null,
        reference_id: referenceId ?? null,
        created_by: createdBy,
      })
      .select('id')
      .single()
    if (error) throw error
    if (!data) throw new Error('Failed to create financial transaction')
    return data.id
  },
}

export type SearchResult = {
  id: string
  trackingNumber: string | null
  status: string
  destinationCountry: string
  receiverName: string
  officeId: string | null
  updatedAt: string
  source: 'shipment' | 'transfer' | 'issue'
}

export type SearchFilters = {
  query?: string
  status?: string
  officeId?: string
  startDate?: string
  endDate?: string
  source?: 'shipment' | 'transfer' | 'issue' | 'all'
}

export const searchService = {
  async search(filters: SearchFilters): Promise<SearchResult[]> {
    const client = getClient()
    const results: SearchResult[] = []

    const sources = filters.source === 'all' || !filters.source
      ? ['shipment', 'transfer', 'issue']
      : [filters.source]

    if (sources.includes('shipment')) {
      let query = client
        .from('shipments')
        .select('id, tracking_number, office_id, status, destination_country, receiver_name, updated_at')
        .order('updated_at', { ascending: false })

      if (filters.query) {
        query = query.ilike('tracking_number', `%${filters.query}%`)
      }
      if (filters.status) {
        query = query.eq('status', filters.status as ShipmentStatus)
      }
      if (filters.officeId) {
        query = query.eq('office_id', filters.officeId)
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error } = await query
      if (error) throw error

      ;(data ?? []).forEach((row: any) => {
        results.push({
          id: row.id,
          trackingNumber: row.tracking_number,
          status: row.status,
          destinationCountry: row.destination_country,
          receiverName: row.receiver_name,
          officeId: row.office_id,
          updatedAt: row.updated_at,
          source: 'shipment',
        })
      })
    }

    if (sources.includes('transfer')) {
      let query = client
        .from('shipment_transfers')
        .select('id, shipment_id, source_office_id, destination_office_id, office_id, state, created_at')
        .order('created_at', { ascending: false })

      if (filters.officeId) {
        query = query.eq('office_id', filters.officeId)
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error } = await query
      if (error) throw error

      ;(data ?? []).forEach((row: any) => {
        results.push({
          id: row.id,
          trackingNumber: row.shipment_id,
          status: row.state,
          destinationCountry: '',
          receiverName: '',
          officeId: row.office_id,
          updatedAt: row.created_at,
          source: 'transfer',
        })
      })
    }

    if (sources.includes('issue')) {
      let query = client
        .from('shipment_issues')
        .select('id, shipment_id, office_id, kind, state, created_at')
        .order('created_at', { ascending: false })

      if (filters.officeId) {
        query = query.eq('office_id', filters.officeId)
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error } = await query
      if (error) throw error

      ;(data ?? []).forEach((row: any) => {
        results.push({
          id: row.id,
          trackingNumber: row.shipment_id,
          status: row.state,
          destinationCountry: '',
          receiverName: '',
          officeId: row.office_id,
          updatedAt: row.created_at,
          source: 'issue',
        })
      })
    }

    results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return results
  },
}

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
