import type { ShipmentStatus } from '@/types/shipment'

export type ShipmentFlow = 'incoming' | 'outgoing'
export type ShipmentIssueKind = 'damaged' | 'missing' | 'delay'
export type IssueState = 'open' | 'resolved'
export type ApprovalState = 'pending' | 'approved' | 'rejected' | 'none'

export interface OperationalShipment {
  id: string
  trackingNumber: string
  officeId: string
  officeName: string
  flow: ShipmentFlow
  status: ShipmentStatus
  destination: string
  recipient: string
  location: string
  storageLocation: string
  updatedAt: string
  notes: string
  approval: ApprovalState
}

export interface OperationalIssue {
  id: string
  trackingNumber: string
  officeId: string
  kind: ShipmentIssueKind
  description: string
  state: IssueState
  createdAt: string
}

export interface OperationalTransfer {
  id: string
  trackingNumber: string
  officeId: string
  fromOffice: string
  toOffice: string
  state: 'in_transit' | 'received'
  createdAt: string
  note: string
}

export interface WarehouseActivity {
  id: string
  trackingNumber: string
  officeId: string
  activity: string
  location: string
  createdAt: string
}

export const demoOperationOffices = [
  { id: 'demo-office-kbl', name: 'Kabul Central' },
  { id: 'demo-office-hrt', name: 'Herat Branch' },
  { id: 'demo-office-mzr', name: 'Mazar Branch' },
]

export const demoOperationalShipments: OperationalShipment[] = [
  {
    id: 'demo-operation-001',
    trackingNumber: 'DEMO-MRQ-7001',
    officeId: 'demo-office-kbl',
    officeName: 'Kabul Central',
    flow: 'incoming',
    status: 'in_transit',
    destination: 'Kabul Central',
    recipient: 'Farid Noor',
    location: 'Kabul Gateway',
    storageLocation: '',
    updatedAt: '2026-11-14T08:40:00.000Z',
    notes: 'Inbound line-haul arrival expected today.',
    approval: 'pending',
  },
  {
    id: 'demo-operation-002',
    trackingNumber: 'DEMO-MRQ-7002',
    officeId: 'demo-office-kbl',
    officeName: 'Kabul Central',
    flow: 'outgoing',
    status: 'in_warehouse',
    destination: 'Herat Branch',
    recipient: 'Mina Sediqi',
    location: 'Kabul Central',
    storageLocation: 'A-03 / Shelf 2',
    updatedAt: '2026-11-14T07:25:00.000Z',
    notes: 'Ready for dispatch after document check.',
    approval: 'pending',
  },
  {
    id: 'demo-operation-003',
    trackingNumber: 'DEMO-MRQ-7003',
    officeId: 'demo-office-kbl',
    officeName: 'Kabul Central',
    flow: 'incoming',
    status: 'delayed',
    destination: 'Kabul Central',
    recipient: 'Omid Ahmadi',
    location: 'Kabul Gateway',
    storageLocation: '',
    updatedAt: '2026-11-13T16:10:00.000Z',
    notes: 'Arrival delayed; carrier update requested.',
    approval: 'pending',
  },
  {
    id: 'demo-operation-004',
    trackingNumber: 'DEMO-MRQ-7004',
    officeId: 'demo-office-hrt',
    officeName: 'Herat Branch',
    flow: 'outgoing',
    status: 'in_warehouse',
    destination: 'Mazar Branch',
    recipient: 'Laila Ahmad',
    location: 'Herat Branch',
    storageLocation: 'B-01 / Bin 4',
    updatedAt: '2026-11-13T12:15:00.000Z',
    notes: 'Awaiting route confirmation.',
    approval: 'pending',
  },
  {
    id: 'demo-operation-005',
    trackingNumber: 'DEMO-MRQ-7005',
    officeId: 'demo-office-mzr',
    officeName: 'Mazar Branch',
    flow: 'incoming',
    status: 'in_warehouse',
    destination: 'Mazar Branch',
    recipient: 'Sahar Rahimi',
    location: 'Mazar Branch',
    storageLocation: 'C-02 / Shelf 1',
    updatedAt: '2026-11-12T10:00:00.000Z',
    notes: 'Received and awaiting recipient notification.',
    approval: 'approved',
  },
]

export const demoOperationalIssues: OperationalIssue[] = [
  {
    id: 'demo-issue-001',
    trackingNumber: 'DEMO-MRQ-7006',
    officeId: 'demo-office-kbl',
    kind: 'damaged',
    description: 'Outer carton is visibly dented; contents need inspection.',
    state: 'open',
    createdAt: '2026-11-14T06:35:00.000Z',
  },
  {
    id: 'demo-issue-002',
    trackingNumber: 'DEMO-MRQ-7007',
    officeId: 'demo-office-kbl',
    kind: 'missing',
    description: 'Parcel not located during the shelf count.',
    state: 'open',
    createdAt: '2026-11-13T14:20:00.000Z',
  },
  {
    id: 'demo-issue-003',
    trackingNumber: 'DEMO-MRQ-7008',
    officeId: 'demo-office-hrt',
    kind: 'delay',
    description: 'Transfer arrival is past the expected window.',
    state: 'resolved',
    createdAt: '2026-11-11T09:10:00.000Z',
  },
]

export const demoOperationalTransfers: OperationalTransfer[] = [
  {
    id: 'demo-transfer-001',
    trackingNumber: 'DEMO-MRQ-7010',
    officeId: 'demo-office-kbl',
    fromOffice: 'Kabul Central',
    toOffice: 'Herat Branch',
    state: 'in_transit',
    createdAt: '2026-11-14T05:30:00.000Z',
    note: 'Scheduled line-haul transfer.',
  },
  {
    id: 'demo-transfer-002',
    trackingNumber: 'DEMO-MRQ-7011',
    officeId: 'demo-office-hrt',
    fromOffice: 'Herat Branch',
    toOffice: 'Mazar Branch',
    state: 'received',
    createdAt: '2026-11-13T07:45:00.000Z',
    note: 'Received and counted at destination.',
  },
]

export const demoWarehouseActivities: WarehouseActivity[] = [
  {
    id: 'demo-activity-001',
    trackingNumber: 'DEMO-MRQ-7005',
    officeId: 'demo-office-mzr',
    activity: 'Shipment received',
    location: 'Receiving desk',
    createdAt: '2026-11-14T09:20:00.000Z',
  },
  {
    id: 'demo-activity-002',
    trackingNumber: 'DEMO-MRQ-7002',
    officeId: 'demo-office-kbl',
    activity: 'Storage location recorded',
    location: 'A-03 / Shelf 2',
    createdAt: '2026-11-14T07:25:00.000Z',
  },
  {
    id: 'demo-activity-003',
    trackingNumber: 'DEMO-MRQ-7010',
    officeId: 'demo-office-kbl',
    activity: 'Transfer registered',
    location: 'Dispatch bay',
    createdAt: '2026-11-14T05:30:00.000Z',
  },
]

export function forAssignedOffice<T extends { officeId: string }>(rows: T[], officeId: string): T[] {
  return rows
    .filter((row) => row.officeId === 'demo-office-kbl' || row.officeId === officeId)
    .map((row) => row.officeId === 'demo-office-kbl' ? { ...row, officeId } : row)
}
