import { mockShipments } from '@/data/mock-shipments'
import { maskName } from '@/lib/format'
import { normalizeDigits, normalizeTrackingNumber } from '@/lib/validation'
import type {
  PublicTrackingInfo,
  Shipment,
  ShipmentInput,
  ShipmentStats,
  StatusUpdateInput,
} from '@/types/shipment'

/**
 * Shipment data access layer.
 *
 * Currently backed by an in-memory copy of the mock data (resets on full page reload).
 * To migrate, replace each method body with a Supabase query via `getSupabaseClient()`
 * from '@/lib/supabase' — UI components only depend on this interface.
 */

export class ShipmentServiceError extends Error {
  constructor(public code: 'not_found' | 'tracking_taken') {
    super(code)
  }
}

let store: Shipment[] = structuredClone(mockShipments)

const latency = () => new Promise((resolve) => setTimeout(resolve, 150))
const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

function generateTrackingNumber() {
  let candidate = ''
  do {
    candidate = `MRQ${Math.floor(100000000 + Math.random() * 900000000)}`
  } while (store.some((s) => s.trackingNumber === candidate))
  return candidate
}

function sanitize(input: ShipmentInput): ShipmentInput {
  const party = (p: ShipmentInput['sender']) => ({
    name: p.name.trim(),
    phone: normalizeDigits(p.phone.trim()),
    address: p.address.trim(),
  })
  return {
    ...input,
    trackingNumber: normalizeTrackingNumber(input.trackingNumber),
    sender: party(input.sender),
    receiver: party(input.receiver),
    description: input.description.trim(),
  }
}

function assertTrackingAvailable(trackingNumber: string, excludeId?: string) {
  if (store.some((s) => s.trackingNumber === trackingNumber && s.id !== excludeId)) {
    throw new ShipmentServiceError('tracking_taken')
  }
}

function byNewest(a: Shipment, b: Shipment) {
  return b.createdAt.localeCompare(a.createdAt)
}

export const shipmentService = {
  async list(): Promise<Shipment[]> {
    await latency()
    return [...store].sort(byNewest)
  },

  async getById(id: string): Promise<Shipment | null> {
    await latency()
    return store.find((s) => s.id === id) ?? null
  },

  async trackPublic(trackingNumber: string): Promise<PublicTrackingInfo | null> {
    await latency()
    const shipment = store.find((s) => s.trackingNumber === normalizeTrackingNumber(trackingNumber))
    if (!shipment) return null
    return {
      trackingNumber: shipment.trackingNumber,
      senderName: maskName(shipment.sender.name),
      receiverName: maskName(shipment.receiver.name),
      packageType: shipment.packageType,
      status: shipment.status,
      registrationDate: shipment.registrationDate,
      updatedAt: shipment.updatedAt,
      events: shipment.events.map(({ id, status, location, note, createdAt }) => ({
        id,
        status,
        location,
        note,
        createdAt,
      })),
    }
  },

  async create(input: ShipmentInput, userId: string): Promise<Shipment> {
    await latency()
    const clean = sanitize(input)
    const trackingNumber = clean.trackingNumber || generateTrackingNumber()
    assertTrackingAvailable(trackingNumber)
    const now = new Date().toISOString()
    const shipment: Shipment = {
      id: uid('shp'),
      ...clean,
      trackingNumber,
      createdAt: now,
      updatedAt: now,
      events: [{ id: uid('evt'), status: clean.status, createdAt: now, createdBy: userId }],
    }
    store = [shipment, ...store]
    return shipment
  },

  async update(id: string, input: ShipmentInput, userId: string): Promise<Shipment> {
    await latency()
    const existing = store.find((s) => s.id === id)
    if (!existing) throw new ShipmentServiceError('not_found')
    const clean = sanitize(input)
    const trackingNumber = clean.trackingNumber || existing.trackingNumber
    assertTrackingAvailable(trackingNumber, id)
    const now = new Date().toISOString()
    const statusChanged = clean.status !== existing.status
    const updated: Shipment = {
      ...existing,
      ...clean,
      trackingNumber,
      updatedAt: now,
      events: statusChanged
        ? [...existing.events, { id: uid('evt'), status: clean.status, createdAt: now, createdBy: userId }]
        : existing.events,
    }
    store = store.map((s) => (s.id === id ? updated : s))
    return updated
  },

  async updateStatus(id: string, input: StatusUpdateInput, userId: string): Promise<Shipment> {
    await latency()
    const existing = store.find((s) => s.id === id)
    if (!existing) throw new ShipmentServiceError('not_found')
    const now = new Date().toISOString()
    const updated: Shipment = {
      ...existing,
      status: input.status,
      updatedAt: now,
      events: [
        ...existing.events,
        {
          id: uid('evt'),
          status: input.status,
          location: input.location?.trim() || undefined,
          note: input.note?.trim() || undefined,
          createdAt: now,
          createdBy: userId,
        },
      ],
    }
    store = store.map((s) => (s.id === id ? updated : s))
    return updated
  },

  /** Must be restricted to administrators by RLS once backed by Supabase. */
  async remove(id: string): Promise<void> {
    await latency()
    store = store.filter((s) => s.id !== id)
  },

  async getStats(): Promise<ShipmentStats> {
    await latency()
    return {
      total: store.length,
      registered: store.filter((s) => s.status === 'registered').length,
      inTransit: store.filter((s) =>
        ['dispatched', 'in_transit', 'out_for_delivery'].includes(s.status),
      ).length,
      delivered: store.filter((s) => s.status === 'delivered').length,
    }
  },
}
