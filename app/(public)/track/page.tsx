import type { Metadata } from 'next'
import { TrackView } from '@/components/tracking/track-view'

export const metadata: Metadata = {
  title: 'Track Shipment',
  description: 'Track your MRQ Express Post shipment with your tracking number.',
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ number?: string | string[] }> }) {
  const { number } = await searchParams
  const value = (Array.isArray(number) ? number[0] : number)?.trim().toUpperCase() ?? ''
  return <TrackView number={value} />
}
