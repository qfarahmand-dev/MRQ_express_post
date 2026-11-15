import type { Metadata } from 'next'
import { AdminShipmentActivity } from '@/components/operations/admin-shipment-activity'
import { ShipmentsList } from '@/components/shipments/shipments-list'

export const metadata: Metadata = { title: 'All Shipments' }

export default function ShipmentsPage() {
  return (
    <>
      <ShipmentsList />
      <AdminShipmentActivity />
    </>
  )
}
