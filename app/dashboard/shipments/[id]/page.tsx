import type { Metadata } from 'next'
import { ShipmentDetails } from '@/components/shipments/shipment-details'

export const metadata: Metadata = { title: 'Shipment Details' }

export default async function ShipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ShipmentDetails id={id} />
}
