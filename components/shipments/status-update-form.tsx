'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { StatusSelect } from '@/components/shipments/status-select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { refreshShipments } from '@/hooks/use-shipments'
import { interpolate } from '@/lib/format'
import { shipmentService } from '@/services/shipment-service'
import type { Shipment, ShipmentStatus } from '@/types/shipment'

export function StatusUpdateForm({ shipment }: { shipment: Shipment }) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [status, setStatus] = useState<ShipmentStatus>(shipment.status)
  const [location, setLocation] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      await shipmentService.updateStatus(shipment.id, { status, location, note }, user.id)
      await refreshShipments()
      toast.success(interpolate(t.details.statusUpdated, { status: t.statuses[status] }))
      setLocation('')
      setNote('')
    } catch {
      toast.error(t.common.unexpectedError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.details.updateStatus}</CardTitle>
        <CardDescription>{t.details.updateStatusHint}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField id="new-status" label={t.details.newStatus} required>
            <StatusSelect id="new-status" value={status} onChange={setStatus} />
          </FormField>
          <FormField id="status-location" label={t.details.location} optionalLabel={t.common.optional}>
            <Input
              id="status-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.details.locationPlaceholder}
              maxLength={120}
              className="h-10"
            />
          </FormField>
          <FormField id="status-note" label={t.details.note} optionalLabel={t.common.optional}>
            <Textarea
              id="status-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.details.notePlaceholder}
              maxLength={300}
            />
          </FormField>
          <Button type="submit" size="lg" disabled={submitting} className="font-semibold">
            {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {submitting ? t.common.saving : t.details.submitStatus}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
