import {
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  Building2,
  CircleAlert,
  ClipboardCheck,
  FileChartColumnIncreasing,
  LayoutDashboard,
  Package,
  PackageCheck,
  PackageOpen,
  ScanSearch,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Warehouse,
  WalletCards,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'
import type { Capability, UserRole } from '@/types/user'

export type DashboardNavLabel = keyof Dictionary['nav']

export interface DashboardNavItem {
  href: string
  label: DashboardNavLabel
  icon: LucideIcon
  capability?: Capability
  officeScoped?: boolean
  exact?: boolean
  exclude?: string
}

export const ROLE_NAVIGATION: Record<UserRole, DashboardNavItem[]> = {
  admin: [
    { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/shipments', label: 'shipments', icon: Package, capability: 'shipments.view' },
    { href: '/dashboard/users', label: 'usersManagement', icon: Users, capability: 'users.manage', exact: true },
    { href: '/dashboard/roles', label: 'rolesAccess', icon: ShieldCheck, capability: 'roles.assign', exact: true },
    { href: '/dashboard/offices', label: 'officesBranches', icon: Building2, capability: 'offices.manage', exact: true },
    { href: '/dashboard/reports', label: 'reports', icon: FileChartColumnIncreasing, capability: 'reports.operational.view', exact: true },
    { href: '/dashboard/reports/financial', label: 'financialReports', icon: WalletCards, capability: 'reports.financial.view', exact: true },
    { href: '/dashboard/audit-logs', label: 'auditLogs', icon: ClipboardCheck, capability: 'auditLogs.view', exact: true },
    { href: '/dashboard/settings', label: 'settings', icon: Settings, capability: 'settings.manage', exact: true },
  ],
  office_manager: [
    { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/operations/shipments', label: 'shipments', icon: Package, capability: 'shipments.view', officeScoped: true, exact: true },
    { href: '/dashboard/employees', label: 'officeEmployees', icon: Users, capability: 'employees.manage', officeScoped: true, exact: true },
    { href: '/dashboard/operations/incoming', label: 'incomingShipments', icon: ArrowDownToLine, capability: 'shipmentFlows.monitor', officeScoped: true, exact: true },
    { href: '/dashboard/operations/outgoing', label: 'outgoingShipments', icon: ArrowUpFromLine, capability: 'shipmentFlows.monitor', officeScoped: true, exact: true },
    { href: '/dashboard/warehouse-monitoring', label: 'warehouseMonitoring', icon: Warehouse, capability: 'storekeeperActivities.view', officeScoped: true, exact: true },
    { href: '/dashboard/approvals', label: 'approvals', icon: PackageCheck, capability: 'officeOperations.approve', officeScoped: true, exact: true },
    { href: '/dashboard/operations/issues', label: 'operationalIssues', icon: Wrench, capability: 'shipmentProblems.manage', officeScoped: true, exact: true },
    { href: '/dashboard/office-reports', label: 'officeReports', icon: FileChartColumnIncreasing, capability: 'reports.office.view', officeScoped: true, exact: true },
  ],
  storekeeper: [
    { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/warehouse/incoming', label: 'incomingShipments', icon: ArrowDownToLine, capability: 'warehouse.incoming.view', officeScoped: true, exact: true },
    { href: '/dashboard/warehouse/outgoing', label: 'outgoingShipments', icon: ArrowUpFromLine, capability: 'warehouse.outgoing.register', officeScoped: true, exact: true },
    { href: '/dashboard/warehouse', label: 'warehouse', icon: PackageOpen, capability: 'warehouse.incoming.view', officeScoped: true, exact: true },
    { href: '/dashboard/warehouse/scanning', label: 'shipmentScanning', icon: ScanSearch, capability: 'warehouse.tracking.scan', officeScoped: true, exact: true },
    { href: '/dashboard/warehouse/issues', label: 'damagedMissingShipments', icon: CircleAlert, capability: 'warehouse.shipmentIssues.report', officeScoped: true, exact: true },
    { href: '/dashboard/warehouse/transfers', label: 'shipmentTransfers', icon: ArrowRightLeft, capability: 'warehouse.shipmentTransfers.register', officeScoped: true, exact: true },
  ],
}

export type DashboardRouteAccess =
  | { capability: Capability; officeScoped: boolean }
  | 'public'
  | 'unauthorized'

export function getDashboardRouteAccess(pathname: string, role: UserRole): DashboardRouteAccess {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (normalizedPath === '/dashboard' || normalizedPath === '/dashboard/profile') return 'public'

  if (role === 'admin' && normalizedPath === '/dashboard/tracking') {
    return { capability: 'shipments.view', officeScoped: false }
  }

  if (role === 'admin' && normalizedPath === '/dashboard/shipments/new') {
    return { capability: 'shipments.manage', officeScoped: false }
  }

  if (
    role === 'admin'
    && normalizedPath.startsWith('/dashboard/shipments/')
    && normalizedPath.endsWith('/edit')
  ) {
    return { capability: 'shipments.manage', officeScoped: false }
  }

  const matchingItem = Object.values(ROLE_NAVIGATION)
    .flat()
    .filter((item) => normalizedPath === item.href || (!item.exact && normalizedPath.startsWith(`${item.href}/`)))
    .sort((first, second) => second.href.length - first.href.length)[0]

  if (matchingItem?.capability) {
    return { capability: matchingItem.capability, officeScoped: Boolean(matchingItem.officeScoped) }
  }

  return 'unauthorized'
}

