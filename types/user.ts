export const USER_ROLES = ['admin', 'office_manager', 'storekeeper'] as const
export type UserRole = (typeof USER_ROLES)[number]

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.some((role) => role === value)
}

export type AccountStatus = 'active' | 'inactive'
export type OfficeStatus = AccountStatus

export type UserAssignment =
  | { role: 'admin'; officeId: null; accountStatus: AccountStatus }
  | { role: 'office_manager' | 'storekeeper'; officeId: string; accountStatus: AccountStatus }

export type AppUser = UserAssignment & {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  createdAt: string
  mustChangePassword: boolean
}

export interface ProfileUpdateInput {
  fullName: string
  email: string
}

export const RBAC_CAPABILITIES = [
  'users.manage',
  'roles.assign',
  'offices.manage',
  'shipments.view',
  'shipments.manage',
  'settings.manage',
  'reports.financial.view',
  'reports.operational.view',
  'auditLogs.view',
  'employees.manage',
  'officeOperations.manage',
  'officeOperations.approve',
  'officeOperations.reject',
  'storekeeperActivities.view',
  'reports.office.view',
  'shipmentProblems.manage',
  'shipmentFlows.monitor',
  'warehouse.incoming.view',
  'warehouse.incoming.register',
  'warehouse.outgoing.register',
  'warehouse.tracking.scan',
  'warehouse.statuses.update',
  'warehouse.storageLocations.record',
  'warehouse.shipments.view',
  'warehouse.shipmentIssues.report',
  'warehouse.shipmentTransfers.register',
] as const

export type Capability = (typeof RBAC_CAPABILITIES)[number]

export const ROLE_CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  admin: RBAC_CAPABILITIES,
  office_manager: [
    'shipments.view',
    'shipments.manage',
    'employees.manage',
    'officeOperations.manage',
    'officeOperations.approve',
    'officeOperations.reject',
    'storekeeperActivities.view',
    'reports.office.view',
    'shipmentProblems.manage',
    'shipmentFlows.monitor',
  ],
  storekeeper: [
    'warehouse.incoming.view',
    'warehouse.incoming.register',
    'warehouse.outgoing.register',
    'warehouse.tracking.scan',
    'warehouse.statuses.update',
    'warehouse.storageLocations.record',
    'warehouse.shipments.view',
    'warehouse.shipmentIssues.report',
    'warehouse.shipmentTransfers.register',
  ],
}

const OFFICE_SCOPED_CAPABILITIES = new Set<Capability>([
  'shipments.view',
  'employees.manage',
  'officeOperations.manage',
  'officeOperations.approve',
  'officeOperations.reject',
  'storekeeperActivities.view',
  'reports.office.view',
  'shipmentProblems.manage',
  'shipmentFlows.monitor',
  'warehouse.incoming.view',
  'warehouse.incoming.register',
  'warehouse.outgoing.register',
  'warehouse.tracking.scan',
  'warehouse.statuses.update',
  'warehouse.storageLocations.record',
  'warehouse.shipments.view',
  'warehouse.shipmentIssues.report',
  'warehouse.shipmentTransfers.register',
])

type AccessSubject = Pick<AppUser, 'role' | 'officeId' | 'accountStatus'>

export function hasCapability(user: AccessSubject | undefined, capability: Capability): boolean {
  return Boolean(
    user
      && user.accountStatus === 'active'
      && ROLE_CAPABILITIES[user.role].includes(capability),
  )
}

export function canAccess(
  user: AccessSubject | undefined,
  capability: Capability,
  targetOfficeId?: string,
): boolean {
  if (!hasCapability(user, capability) || !user) return false
  if (user.role === 'admin') return true
  if (!OFFICE_SCOPED_CAPABILITIES.has(capability)) return false
  return targetOfficeId === user.officeId
}

export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'updateStatus'

/**
 * Kept for the existing shipment UI. Use role capabilities for module-level access.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['view', 'create', 'edit', 'delete', 'updateStatus'],
  office_manager: ['view', 'create', 'edit', 'delete', 'updateStatus'],
  storekeeper: ['view', 'create', 'edit', 'updateStatus'],
}

/**
 * Centralized RBAC helper functions.
 * All authorization checks flow through these functions so permission logic
 * is not duplicated across components.
 */

/**
 * Whether a user can create shipments.
 * Admin: always allowed (no office restriction).
 * Office Manager: allowed, shipment must belong to their office.
 * Storekeeper: not allowed.
 */
export function canCreateShipment(user: AppUser | undefined): boolean {
  if (!user || user.accountStatus !== 'active') return false
  if (user.role === 'admin') return true
  if (user.role === 'office_manager') return true
  return false
}

/**
 * Whether a user can delete a specific shipment.
 * Admin: always allowed (system-wide).
 * Office Manager: allowed only if the shipment belongs to their office.
 * Storekeeper: not allowed.
 */
export function canDeleteShipment(user: AppUser | undefined, shipmentOfficeId: string | null): boolean {
  if (!user || user.accountStatus !== 'active') return false
  if (user.role === 'admin') return true
  if (user.role === 'office_manager') {
    return Boolean(shipmentOfficeId && shipmentOfficeId === user.officeId)
  }
  return false
}

/**
 * Whether a user can access the Advanced Search page.
 * Admin: always allowed.
 * Office Manager: not allowed.
 * Storekeeper: not allowed.
 */
export function canAccessAdvancedSearch(user: AppUser | undefined): boolean {
  if (!user || user.accountStatus !== 'active') return false
  return user.role === 'admin'
}

/**
 * Whether a user can delete a specific user account.
 * Admin: can delete any eligible user except themselves.
 * Office Manager: can delete storekeepers from their own office only.
 * Storekeeper: not allowed.
 */
export function canDeleteUser(
  actor: AppUser | undefined,
  target: { id: string; role: UserRole; officeId: string | null } | undefined,
): boolean {
  if (!actor || actor.accountStatus !== 'active') return false
  if (!target) return false

  // Cannot delete oneself
  if (actor.id === target.id) return false

  if (actor.role === 'admin') return true

  if (actor.role === 'office_manager') {
    return (
      target.role === 'storekeeper' &&
      Boolean(target.officeId) &&
      target.officeId === actor.officeId
    )
  }

  return false
}
