import { getSupabaseClient } from '@/lib/supabase'
import { normalizeDigits, normalizeTrackingNumber } from '@/lib/validation'
import type {
  PublicTrackingInfo,
  Shipment,
  ShipmentInput,
  ShipmentReports,
  ShipmentStats,
  StatusUpdateInput,
} from '@/types/shipment'
import type { Database } from '@/types/database'

type ShipmentRow = Database['public']['Tables']['shipments']['Row']
type EventRow = Database['public']['Tables']['shipment_events']['Row']

export class ShipmentServiceError extends Error {
  constructor(public code: 'not_found' | 'tracking_taken' | 'not_configured' | 'request_failed', message?: string) {
    super(message ?? code)
    this.name = 'ShipmentServiceError'
  }
}

function getClient() {
  const client = getSupabaseClient()
  if (!client) throw new ShipmentServiceError('not_configured')
  return client
}

function throwDatabaseError(error: { code?: string; message: string }): never {
  if (error.code === '23505') throw new ShipmentServiceError('tracking_taken', error.message)
  if (error.code === 'P0002') throw new ShipmentServiceError('not_found', error.message)
  throw new ShipmentServiceError('request_failed', error.message)
}

function sanitize(input: ShipmentInput): ShipmentInput {
  const party = (value: ShipmentInput['sender']) => ({
    name: value.name.trim(),
    phone: normalizeDigits(value.phone.trim()),
    address: value.address.trim(),
  })

  return {
    ...input,
    trackingNumber: normalizeTrackingNumber(input.trackingNumber),
    destinationCountry: input.destinationCountry.trim().toUpperCase(),
    sender: party(input.sender),
    receiver: party(input.receiver),
    description: input.description.trim(),
  }
}

function mapEvent(row: EventRow) {
  return {
    id: row.id,
    status: row.status,
    location: row.location ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
  }
}

function mapShipment(row: ShipmentRow, events: ReturnType<typeof mapEvent>[]): Shipment {
  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    destinationCountry: row.destination_country,
    sender: { name: row.sender_name, phone: row.sender_phone, address: row.sender_address },
    receiver: { name: row.receiver_name, phone: row.receiver_phone, address: row.receiver_address },
    packageType: row.package_type,
    description: row.description,
    registrationDate: row.registration_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    events,
  }
}

async function loadEvents(shipmentIds: string[]) {
  const grouped = new Map<string, ReturnType<typeof mapEvent>[]>()
  if (shipmentIds.length === 0) return grouped

  const { data, error } = await getClient()
    .from('shipment_events')
    .select('*')
    .in('shipment_id', shipmentIds)
    .order('created_at', { ascending: true })
  if (error) throwDatabaseError(error)

  for (const row of data) {
    const events = grouped.get(row.shipment_id) ?? []
    events.push(mapEvent(row))
    grouped.set(row.shipment_id, events)
  }
  return grouped
}

function shipmentArgs(input: ShipmentInput) {
  const clean = sanitize(input)
  return {
    p_tracking_number: clean.trackingNumber,
    p_destination_country: clean.destinationCountry,
    p_sender_name: clean.sender.name,
    p_sender_phone: clean.sender.phone,
    p_sender_address: clean.sender.address,
    p_receiver_name: clean.receiver.name,
    p_receiver_phone: clean.receiver.phone,
    p_receiver_address: clean.receiver.address,
    p_package_type: clean.packageType,
    p_description: clean.description,
    p_registration_date: clean.registrationDate,
    p_status: clean.status,
  }
}

export const shipmentService = {
  async list(): Promise<Shipment[]> {
    const { data, error } = await getClient()
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwDatabaseError(error)

    const events = await loadEvents(data.map((row) => row.id))
    return data.map((row) => mapShipment(row, events.get(row.id) ?? []))
  },

  async getById(id: string): Promise<Shipment | null> {
    const { data, error } = await getClient()
      .from('shipments')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throwDatabaseError(error)
    if (!data) return null

    const events = await loadEvents([data.id])
    return mapShipment(data, events.get(data.id) ?? [])
  },

  async trackPublic(trackingNumber: string): Promise<PublicTrackingInfo | null> {
    const { data, error } = await getClient().rpc('track_shipment', {
      p_tracking_number: normalizeTrackingNumber(trackingNumber),
    })
    if (error) throwDatabaseError(error)
    const row = data[0]
    if (!row) return null

    return {
      trackingNumber: row.tracking_number,
      senderName: row.sender_name,
      receiverName: row.receiver_name,
      packageType: row.package_type,
      status: row.status,
      registrationDate: row.registration_date,
      updatedAt: row.updated_at,
      events: row.events.map((event) => ({
        id: event.id,
        status: event.status,
        location: event.location ?? undefined,
        note: event.note ?? undefined,
        createdAt: event.createdAt,
      })),
    }
  },

  async create(input: ShipmentInput, _userId: string): Promise<Shipment> {
    const { data: id, error } = await getClient().rpc('create_shipment', shipmentArgs(input))
    if (error) throwDatabaseError(error)
    if (!id) throw new ShipmentServiceError('request_failed', 'Supabase did not return the new shipment id')

    const shipment = await this.getById(id)
    if (!shipment) throw new ShipmentServiceError('request_failed', 'Created shipment could not be loaded')
    return shipment
  },

  async update(id: string, input: ShipmentInput, _userId: string): Promise<Shipment> {
    const { data: updatedId, error } = await getClient().rpc('update_shipment', {
      p_shipment_id: id,
      ...shipmentArgs(input),
    })
    if (error) throwDatabaseError(error)
    if (!updatedId) throw new ShipmentServiceError('not_found')

    const shipment = await this.getById(updatedId)
    if (!shipment) throw new ShipmentServiceError('not_found')
    return shipment
  },

  async updateStatus(id: string, input: StatusUpdateInput, _userId: string): Promise<Shipment> {
    const { data: updatedId, error } = await getClient().rpc('update_shipment_status', {
      p_shipment_id: id,
      p_status: input.status,
      p_location: input.location?.trim() || null,
      p_note: input.note?.trim() || null,
    })
    if (error) throwDatabaseError(error)
    if (!updatedId) throw new ShipmentServiceError('not_found')

    const shipment = await this.getById(updatedId)
    if (!shipment) throw new ShipmentServiceError('not_found')
    return shipment
  },

  async remove(id: string): Promise<void> {
    const { data, error } = await getClient()
      .from('shipments')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle()
    if (error) throwDatabaseError(error)
    if (!data) throw new ShipmentServiceError('not_found')
  },

  async getStats(): Promise<ShipmentStats> {
    const { data, error } = await getClient().rpc('get_shipment_stats')
    if (error) throwDatabaseError(error)
    const stats = data[0]
    if (!stats) throw new ShipmentServiceError('request_failed', 'Supabase returned no shipment statistics')

    return {
      total: Number(stats.total),
      inWarehouse: Number(stats.in_warehouse),
      inTransit: Number(stats.in_transit),
      delivered: Number(stats.delivered),
    }
  },

  async getReports(): Promise<ShipmentReports> {
    const { data, error } = await getClient().rpc('get_shipment_reports')
    if (error) throwDatabaseError(error)
    const reports = data[0]
    if (!reports) throw new ShipmentServiceError('request_failed', 'Supabase returned no shipment reports')

    return {
      thisWeek: Number(reports.this_week),
      thisMonth: Number(reports.this_month),
      thisYear: Number(reports.this_year),
      topDestinations: reports.top_destinations.map((destination) => ({
        country: destination.country,
        total: Number(destination.total),
      })),
    }
  },
}
