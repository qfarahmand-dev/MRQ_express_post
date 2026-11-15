import type { UserRole } from '@/types/user'

export const AUDIT_ACTIONS = [
  'shipment_status_changed',
  'shipment_received',
  'user_created',
  'user_role_updated',
  'office_updated',
  'warehouse_transfer_registered',
  'issue_reported',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export type AuditDetailsKey =
  | 'roleReviewed'
  | 'arrivalConfirmed'
  | 'damageReported'
  | 'officeContactUpdated'
  | 'transferCreated'
  | 'shipmentDelayed'
  | 'accountCreated'
  | 'shipmentStored'
  | 'shipmentInWarehouse'
  | 'operationApproved'
  | 'storekeeperCreated'

export interface AuditLogEntry {
  id: string
  userName: string
  role: UserRole
  action: AuditAction
  affectedRecord: string
  officeId: string | null
  officeName: string | null
  createdAt: string
  details: AuditDetailsKey
}

export const demoAuditLogs: AuditLogEntry[] = [
  {
    id: 'demo-audit-001',
    userName: 'Mohammad Rahimi',
    role: 'admin',
    action: 'user_role_updated',
    affectedRecord: 'Farid Noor',
    officeId: null,
    officeName: null,
    createdAt: '2026-11-14T10:20:00.000Z',
    details: 'roleReviewed',
  },
  {
    id: 'demo-audit-002',
    userName: 'Farid Noor',
    role: 'storekeeper',
    action: 'shipment_received',
    affectedRecord: 'DEMO-MRQ-7001',
    officeId: 'demo-office-kbl',
    officeName: 'Kabul Central',
    createdAt: '2026-11-14T09:20:00.000Z',
    details: 'arrivalConfirmed',
  },
  {
    id: 'demo-audit-003',
    userName: 'Laila Ahmad',
    role: 'office_manager',
    action: 'issue_reported',
    affectedRecord: 'DEMO-MRQ-7006',
    officeId: 'demo-office-kbl',
    officeName: 'Kabul Central',
    createdAt: '2026-11-14T08:35:00.000Z',
    details: 'damageReported',
  },
  {
    id: 'demo-audit-004',
    userName: 'Mohammad Rahimi',
    role: 'admin',
    action: 'office_updated',
    affectedRecord: 'Herat Branch',
    officeId: 'demo-office-hrt',
    officeName: 'Herat Branch',
    createdAt: '2026-11-13T14:05:00.000Z',
    details: 'officeContactUpdated',
  },
  {
    id: 'demo-audit-005',
    userName: 'Farid Noor',
    role: 'storekeeper',
    action: 'warehouse_transfer_registered',
    affectedRecord: 'DEMO-MRQ-7010',
    officeId: 'demo-office-kbl',
    officeName: 'Kabul Central',
    createdAt: '2026-11-13T12:45:00.000Z',
    details: 'transferCreated',
  },
  {
    id: 'demo-audit-006',
    userName: 'Laila Ahmad',
    role: 'office_manager',
    action: 'shipment_status_changed',
    affectedRecord: 'DEMO-MRQ-7003',
    officeId: 'demo-office-kbl',
    officeName: 'Kabul Central',
    createdAt: '2026-11-12T16:10:00.000Z',
    details: 'shipmentDelayed',
  },
  {
    id: 'demo-audit-007',
    userName: 'Mohammad Rahimi',
    role: 'admin',
    action: 'user_created',
    affectedRecord: 'Laila Ahmad',
    officeId: 'demo-office-kbl',
    officeName: 'Kabul Central',
    createdAt: '2026-11-11T09:30:00.000Z',
    details: 'accountCreated',
  },
  {
    id: 'demo-audit-008',
    userName: 'Mina Sediqi',
    role: 'storekeeper',
    action: 'shipment_received',
    affectedRecord: 'DEMO-MRQ-7005',
    officeId: 'demo-office-hrt',
    officeName: 'Herat Branch',
    createdAt: '2026-11-10T11:00:00.000Z',
    details: 'shipmentStored',
  },
  {
    id: 'demo-audit-009',
    userName: 'Mohammad Rahimi',
    role: 'admin',
    action: 'shipment_status_changed',
    affectedRecord: 'DEMO-MRQ-7002',
    officeId: 'demo-office-kbl',
    officeName: 'Kabul Central',
    createdAt: '2026-11-09T08:25:00.000Z',
    details: 'shipmentInWarehouse',
  },
  {
    id: 'demo-audit-010',
    userName: 'Laila Ahmad',
    role: 'office_manager',
    action: 'shipment_status_changed',
    affectedRecord: 'DEMO-MRQ-7004',
    officeId: 'demo-office-hrt',
    officeName: 'Herat Branch',
    createdAt: '2026-11-08T07:15:00.000Z',
    details: 'operationApproved',
  },
  {
    id: 'demo-audit-011',
    userName: 'Mohammad Rahimi',
    role: 'admin',
    action: 'user_created',
    affectedRecord: 'Mina Sediqi',
    officeId: 'demo-office-hrt',
    officeName: 'Herat Branch',
    createdAt: '2026-11-07T10:40:00.000Z',
    details: 'storekeeperCreated',
  },
]
