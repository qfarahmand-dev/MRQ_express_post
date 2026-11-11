import type { Metadata } from 'next'
import { EditShipmentView } from '@/components/shipments/edit-shipment-view'

export const metadata: Metadata = { title: 'Edit Shipment' }

export default async function EditShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditShipmentView id={id} />
}
