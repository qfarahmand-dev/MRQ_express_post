import type { AccountStatus, UserRole } from '@/types/user'

export interface ManagedUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  officeId: string | null
  accountStatus: AccountStatus
  createdAt: string
  lastLoginAt: string | null
}

export interface ManagedOffice {
  id: string
  name: string
  code: string
  address: string
  phone: string
  email: string
  managerUserId: string | null
  status: AccountStatus
}

export const demoManagedUsers: ManagedUser[] = [
  {
    id: 'demo-admin-01',
    fullName: 'Mohammad Rahimi',
    email: 'm.rahimi@example.test',
    role: 'admin',
    officeId: null,
    accountStatus: 'active',
    createdAt: '2025-03-12T09:00:00.000Z',
    lastLoginAt: '2026-11-12T08:30:00.000Z',
  },
  {
    id: 'demo-manager-kbl',
    fullName: 'Laila Ahmad',
    email: 'l.ahmad@example.test',
    role: 'office_manager',
    officeId: 'demo-office-kbl',
    accountStatus: 'active',
    createdAt: '2025-06-08T09:00:00.000Z',
    lastLoginAt: '2026-11-13T10:15:00.000Z',
  },
  {
    id: 'demo-storekeeper-kbl',
    fullName: 'Farid Noor',
    email: 'f.noor@example.test',
    role: 'storekeeper',
    officeId: 'demo-office-kbl',
    accountStatus: 'active',
    createdAt: '2025-07-14T09:00:00.000Z',
    lastLoginAt: '2026-11-13T07:45:00.000Z',
  },
  {
    id: 'demo-storekeeper-hrt',
    fullName: 'Mina Sediqi',
    email: 'm.sediqi@example.test',
    role: 'storekeeper',
    officeId: 'demo-office-hrt',
    accountStatus: 'inactive',
    createdAt: '2025-08-20T09:00:00.000Z',
    lastLoginAt: null,
  },
]

export const demoManagedOffices: ManagedOffice[] = [
  {
    id: 'demo-office-kbl',
    name: 'Kabul Central',
    code: 'KBL-01',
    address: 'Shahr-e Naw, Kabul',
    phone: '+93 20 000 1001',
    email: 'kabul@example.test',
    managerUserId: 'demo-manager-kbl',
    status: 'active',
  },
  {
    id: 'demo-office-hrt',
    name: 'Herat Branch',
    code: 'HRT-01',
    address: 'Chowk-e Golha, Herat',
    phone: '+93 40 000 1002',
    email: 'herat@example.test',
    managerUserId: null,
    status: 'active',
  },
  {
    id: 'demo-office-mzr',
    name: 'Mazar Branch',
    code: 'MZR-01',
    address: 'Rawza Road, Mazar-i-Sharif',
    phone: '+93 50 000 1003',
    email: 'mazar@example.test',
    managerUserId: null,
    status: 'inactive',
  },
]
