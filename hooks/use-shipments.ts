'use client'

import useSWR, { mutate } from 'swr'
import { shipmentService } from '@/services/shipment-service'

export function useShipments() {
  return useSWR(['shipments', 'list'], () => shipmentService.list())
}

export function useShipment(id: string) {
  return useSWR(['shipments', 'detail', id], () => shipmentService.getById(id))
}

export function useShipmentStats() {
  return useSWR(['shipments', 'stats'], () => shipmentService.getStats())
}

export function useShipmentReports() {
  return useSWR(['shipments', 'reports'], () => shipmentService.getReports())
}

export function refreshShipments() {
  return mutate((key) => Array.isArray(key) && key[0] === 'shipments')
}
