'use client'

import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  CircleCheckBig,
  CircleDollarSign,
  Clock3,
  Package,
  PackageCheck,
  PackagePlus,
  PackageSearch,
  ScanLine,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { LatestUpdates } from '@/components/dashboard/latest-updates'
import { RecentShipments } from '@/components/dashboard/recent-shipments'
import { ShipmentReports } from '@/components/dashboard/shipment-reports'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { demoDashboardData } from '@/data/demo-dashboard-data'
import { formatNumber, interpolate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useShipments } from '@/hooks/use-shipments'
import { ShipmentServiceError } from '@/services/shipment-service'
import type { Shipment } from '@/types/shipment'

type Metric = {
  label: string
  value: number | null | undefined
  icon: LucideIcon
  source: 'live' | 'demo'
  tone: string
}

function DemoNotice({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-highlight/50 bg-highlight/10 px-4 py-3 text-sm leading-relaxed text-foreground">
      {children}
    </p>
  )
}

function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  const { t, lang } = useLanguage()

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map(({ label, value, icon: Icon, source, tone }) => (
        <li key={label} className="flex min-w-0 items-start justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {value === undefined
                ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-muted align-middle" aria-hidden="true" />
                : value === null ? '—' : formatNumber(value, lang)}
            </p>
            <span className={cn(
              'w-fit rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide',
              source === 'live' ? 'bg-green-50 text-success' : 'bg-muted text-muted-foreground',
            )}>
              {source === 'live' ? t.roleDashboard.live : t.roleDashboard.demo}
            </span>
          </div>
          <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', tone)}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        </li>
      ))}
    </ul>
  )
}

function ActivityCard({ title, activities }: { title: string; activities: readonly string[] }) {
  const { t } = useLanguage()

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {t.roleDashboard.demo}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length ? (
          <ul className="divide-y">
            {activities.map((activity, index) => (
              <li key={`${activity}-${index}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Activity className="size-4" aria-hidden="true" />
                </span>
                <p className="pt-1 text-sm leading-relaxed text-foreground">{activity}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t.dashboard.noUpdates}</p>
        )}
      </CardContent>
    </Card>
  )
}

function ProgressCard({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const { t, lang } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {t.roleDashboard.demo}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-5">
          {rows.map(({ label, value }) => (
            <li key={label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{formatNumber(value, lang)}%</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-secondary"
                role="img"
                aria-label={`${label}: ${formatNumber(value, lang)}%`}
              >
                <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function LiveShipmentMetrics() {
  const { t } = useLanguage()
  const { data: shipments, error, isLoading } = useShipments()
  const count = (statuses: Shipment['status'][]) => error
    ? null
    : shipments?.filter((shipment) => statuses.includes(shipment.status)).length
  const metrics: Metric[] = [
    { label: t.dashboard.stats.total, value: error ? null : shipments?.length, icon: Package, source: 'live', tone: 'bg-primary text-highlight' },
    { label: t.roleDashboard.incoming, value: count(['registered', 'in_warehouse']), icon: ArrowDownToLine, source: 'live', tone: 'bg-slate-100 text-slate-700' },
    { label: t.roleDashboard.outgoing, value: count(['dispatched', 'in_transit', 'out_for_delivery']), icon: ArrowUpFromLine, source: 'live', tone: 'bg-highlight/25 text-primary' },
    { label: t.roleDashboard.pending, value: count(['registered', 'delayed']), icon: Clock3, source: 'live', tone: 'bg-amber-50 text-amber-700' },
    { label: t.roleDashboard.delivered, value: count(['delivered']), icon: CircleCheckBig, source: 'live', tone: 'bg-green-50 text-success' },
  ]

  return (
    <section aria-label={t.roleDashboard.shipmentStatistics} className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error instanceof ShipmentServiceError && error.code === 'schema_update_required'
            ? t.dashboard.reportingMigrationRequired
            : t.common.unexpectedError}
        </p>
      )}
      {isLoading && <p role="status" className="sr-only">{t.common.loading}</p>}
      {!isLoading && !error && shipments?.length === 0 && (
        <p className="text-sm text-muted-foreground">{t.roleDashboard.liveShipmentsEmpty}</p>
      )}
      <MetricsGrid metrics={metrics} />
    </section>
  )
}

function AdminFinancialPreview() {
  const { t, lang } = useLanguage()
  const { finance } = demoDashboardData.admin
  const items = [
    { label: t.roleDashboard.revenue, value: finance.revenue },
    { label: t.roleDashboard.operatingCosts, value: finance.operatingCosts },
    { label: t.roleDashboard.netBalance, value: finance.netBalance },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDollarSign className="size-5 text-primary" aria-hidden="true" />
          {t.roleDashboard.financialOverview}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-3">
          {items.map(({ label, value }) => (
            <li key={label} className="rounded-lg bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-bold text-foreground">${formatNumber(value, lang)}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function AdminDashboard() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const demo = demoDashboardData.admin
  const metrics: Metric[] = [
    { label: t.roleDashboard.totalUsers, value: demo.users, icon: Users, source: 'demo', tone: 'bg-slate-100 text-slate-700' },
    { label: t.roleDashboard.totalOffices, value: demo.offices, icon: Building2, source: 'demo', tone: 'bg-highlight/25 text-primary' },
  ]

  return (
    <>
      <PageHeader
        title={user ? interpolate(t.dashboard.welcome, { name: user.fullName.split(' ')[0] }) : t.dashboard.title}
        description={t.roleDashboard.adminDescription}
        actions={
          <Link
            href="/dashboard/shipments/new"
            className={cn(buttonVariants({ size: 'lg' }), 'bg-highlight px-4 font-semibold text-highlight-foreground hover:bg-highlight/85')}
          >
            <PackagePlus aria-hidden="true" />
            {t.dashboard.registerNew}
          </Link>
        }
      />
      <DemoNotice>{t.roleDashboard.adminDemoNotice}</DemoNotice>
      <MetricsGrid metrics={metrics} />
      <LiveShipmentMetrics />
      <section aria-label={t.roleDashboard.shipmentStatistics} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">{t.roleDashboard.shipmentStatistics}</h2>
        <ShipmentReports compact />
      </section>
      <AdminFinancialPreview />
      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityCard title={t.roleDashboard.recentSystemActivities} activities={t.roleDashboard.sampleSystemActivities} />
        <ProgressCard
          title={t.roleDashboard.overallPerformance}
          rows={[
            { label: t.roleDashboard.onTimeRate, value: demo.performance.onTimeRate },
            { label: t.roleDashboard.shipmentGrowth, value: demo.performance.shipmentGrowth },
            { label: t.roleDashboard.officeAvailability, value: Math.round((demo.performance.activeOffices / demo.offices) * 100) },
          ]}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2"><RecentShipments /></div>
        <LatestUpdates />
      </div>
    </>
  )
}

export function OfficeManagerDashboard() {
  const { t } = useLanguage()
  const demo = demoDashboardData.officeManager
  const metrics: Metric[] = [
    { label: t.roleDashboard.officeShipments, value: demo.shipments, icon: Package, source: 'demo', tone: 'bg-primary text-highlight' },
    { label: t.roleDashboard.incoming, value: demo.incoming, icon: ArrowDownToLine, source: 'demo', tone: 'bg-slate-100 text-slate-700' },
    { label: t.roleDashboard.outgoing, value: demo.outgoing, icon: Truck, source: 'demo', tone: 'bg-highlight/25 text-primary' },
    { label: t.roleDashboard.pending, value: demo.pending, icon: Clock3, source: 'demo', tone: 'bg-amber-50 text-amber-700' },
    { label: t.roleDashboard.delivered, value: demo.delivered, icon: PackageCheck, source: 'demo', tone: 'bg-green-50 text-success' },
    { label: t.roleDashboard.officeEmployees, value: demo.employees, icon: Users, source: 'demo', tone: 'bg-slate-100 text-slate-700' },
    { label: t.roleDashboard.delayedShipments, value: demo.delayed, icon: Clock3, source: 'demo', tone: 'bg-amber-50 text-amber-700' },
    { label: t.roleDashboard.problematicShipments, value: demo.problematic, icon: AlertTriangle, source: 'demo', tone: 'bg-red-50 text-destructive' },
  ]

  return (
    <>
      <PageHeader title={t.roleDashboard.officeManagerTitle} description={t.roleDashboard.officeManagerDescription} />
      <DemoNotice>{t.roleDashboard.officeDemoNotice}</DemoNotice>
      <MetricsGrid metrics={metrics} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{t.roleDashboard.storekeeperActivity}</CardTitle>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.roleDashboard.demo}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-3">
              {[
                { label: t.roleDashboard.receivedToday, value: demo.storekeeper.receivedToday, icon: ArrowDownToLine },
                { label: t.roleDashboard.dispatchedToday, value: demo.storekeeper.dispatchedToday, icon: ArrowUpFromLine },
                { label: t.roleDashboard.awaitingApproval, value: demo.storekeeper.awaitingApproval, icon: Clock3 },
              ].map(({ label, value, icon: Icon }) => (
                <li key={label} className="rounded-lg bg-muted/60 p-4">
                  <Icon className="mb-3 size-4 text-primary" aria-hidden="true" />
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <ProgressCard
          title={t.roleDashboard.officePerformance}
          rows={[
            { label: t.roleDashboard.onTimeRate, value: demo.performance.onTimeRate },
            { label: t.roleDashboard.dailyTarget, value: demo.performance.dailyTarget },
            { label: t.roleDashboard.completionRate, value: demo.performance.completionRate },
          ]}
        />
      </div>
      <ActivityCard title={t.roleDashboard.recentOfficeActivities} activities={t.roleDashboard.sampleOfficeActivities} />
    </>
  )
}

export function StorekeeperDashboard() {
  const { t } = useLanguage()
  const demo = demoDashboardData.storekeeper
  const metrics: Metric[] = [
    { label: t.roleDashboard.warehouseIncoming, value: demo.incoming, icon: ArrowDownToLine, source: 'demo', tone: 'bg-slate-100 text-slate-700' },
    { label: t.roleDashboard.warehouseOutgoing, value: demo.outgoing, icon: ArrowUpFromLine, source: 'demo', tone: 'bg-highlight/25 text-primary' },
    { label: t.roleDashboard.currentlyStored, value: demo.stored, icon: Warehouse, source: 'demo', tone: 'bg-primary text-highlight' },
    { label: t.roleDashboard.pendingWarehouse, value: demo.pending, icon: Clock3, source: 'demo', tone: 'bg-amber-50 text-amber-700' },
    { label: t.roleDashboard.damaged, value: demo.damaged, icon: AlertTriangle, source: 'demo', tone: 'bg-red-50 text-destructive' },
    { label: t.roleDashboard.missing, value: demo.missing, icon: PackageSearch, source: 'demo', tone: 'bg-slate-100 text-slate-700' },
  ]
  const actions = [
    { label: t.roleDashboard.receiveShipment, icon: ArrowDownToLine },
    { label: t.roleDashboard.dispatchShipment, icon: ArrowUpFromLine },
    { label: t.roleDashboard.scanTrackingNumber, icon: ScanLine },
    { label: t.roleDashboard.reportDamaged, icon: AlertTriangle },
    { label: t.roleDashboard.reportMissing, icon: PackageSearch },
  ]

  return (
    <>
      <PageHeader title={t.roleDashboard.storekeeperTitle} description={t.roleDashboard.storekeeperDescription} />
      <DemoNotice>{t.roleDashboard.warehouseDemoNotice}</DemoNotice>
      <MetricsGrid metrics={metrics} />
      <Card>
        <CardHeader>
          <CardTitle>{t.roleDashboard.quickActions}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {actions.map(({ label, icon: Icon }) => (
              <Button key={label} type="button" variant="outline" className="h-auto min-h-12 justify-start whitespace-normal py-3 text-start" disabled>
                <Icon aria-hidden="true" />
                {label}
              </Button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t.roleDashboard.actionsUnavailable}</p>
        </CardContent>
      </Card>
      <ActivityCard title={t.roleDashboard.recentWarehouseActivities} activities={t.roleDashboard.sampleStorekeeperActivities} />
    </>
  )
}
