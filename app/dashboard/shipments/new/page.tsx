import type { Metadata } from 'next'
import { NewShipmentView } from '@/components/shipments/new-shipment-view'

export const metadata: Metadata = { title: 'Register Shipment' }

export default function NewShipmentPage() {
  return <NewShipmentView />
}
