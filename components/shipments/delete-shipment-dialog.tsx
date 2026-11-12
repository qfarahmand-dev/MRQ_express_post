'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { refreshShipments } from '@/hooks/use-shipments'
import { interpolate } from '@/lib/format'
import { shipmentService, ShipmentServiceError } from '@/services/shipment-service'
import type { Shipment } from '@/types/shipment'

interface DeleteShipmentDialogProps {
  shipment: Shipment | null
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteShipmentDialog({ shipment, onOpenChange, onDeleted }: DeleteShipmentDialogProps) {
  const { t } = useLanguage()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!shipment) return
    setDeleting(true)
    try {
      await shipmentService.remove(shipment.id)
      toast.success(t.shipments.deleted)
      onOpenChange(false)
      onDeleted?.()
      await refreshShipments()
    } catch (error) {
      if (error instanceof ShipmentServiceError && error.code === 'photo_cleanup_failed') {
        toast.error(t.shipments.photoCleanupError)
        onOpenChange(false)
        onDeleted?.()
        await refreshShipments()
      } else {
        toast.error(t.common.unexpectedError)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={Boolean(shipment)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.shipments.deleteTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {interpolate(t.shipments.deleteDescription, { number: shipment?.trackingNumber || t.shipments.notAssigned })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t.common.cancel}</AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? t.common.deleting : t.common.delete}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
