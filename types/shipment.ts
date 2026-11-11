export const SHIPMENT_STATUSES = [
  'registered',
  'in_warehouse',
  'dispatched',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delayed',
  'returned',
  'cancelled',
] as const

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

export const PACKAGE_TYPES = ['documents', 'goods'] as const

export type PackageType = (typeof PACKAGE_TYPES)[number]

export interface PartyInfo {
  name: string
  phone: string
  address: string
}

export interface ShipmentEvent {
  id: string
  status: ShipmentStatus
  location?: string
  note?: string
  createdAt: string
  createdBy?: string
}

export interface Shipment {
  id: string
  trackingNumber: string
  sender: PartyInfo
  receiver: PartyInfo
  packageType: PackageType
  description: string
  registrationDate: string
  status: ShipmentStatus
  createdAt: string
  updatedAt: string
  events: ShipmentEvent[]
}

export interface ShipmentInput {
  trackingNumber: string
  sender: PartyInfo
  receiver: PartyInfo
  packageType: PackageType
  description: string
  registrationDate: string
  status: ShipmentStatus
}

export interface StatusUpdateInput {
  status: ShipmentStatus
  location?: string
  note?: string
}

/** Public-safe projection used by the tracking page. Never includes phones or full addresses. */
export interface PublicTrackingInfo {
  trackingNumber: string
  senderName: string
  receiverName: string
  packageType: PackageType
  status: ShipmentStatus
  registrationDate: string
  updatedAt: string
  events: Omit<ShipmentEvent, 'createdBy'>[]
}

export interface ShipmentStats {
  total: number
  registered: number
  inTransit: number
  delivered: number
}
