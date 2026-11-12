import type { Metadata } from 'next'
import { TrackView } from '@/components/tracking/track-view'

export const metadata: Metadata = { title: 'Track Shipment' }

export default async function DashboardTrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string | string[] }>
}) {
  const { number } = await searchParams
  const value = (Array.isArray(number) ? number[0] : number)?.trim().toUpperCase() ?? ''
  return <TrackView number={value} resultPath="/dashboard/tracking" includeCarrierTracking />
}
