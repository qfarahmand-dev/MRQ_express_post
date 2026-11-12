'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Loader2, Package, UserRound, UserRoundCheck, type LucideIcon } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { StatusSelect } from '@/components/shipments/status-select'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { destinationCountries } from '@/lib/countries'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { refreshShipments } from '@/hooks/use-shipments'
import { interpolate, todayISODate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { TRACKING_NUMBER_MAX_LENGTH, validateShipmentInput, type ShipmentFormErrors } from '@/lib/validation'
import { shipmentService, ShipmentServiceError } from '@/services/shipment-service'
import { PACKAGE_TYPES, type Shipment, type ShipmentInput } from '@/types/shipment'

const emptyInput = (): ShipmentInput => ({
  trackingNumber: '',
  destinationCountry: '',
  sender: { name: '', phone: '', address: '' },
  receiver: { name: '', phone: '', address: '' },
  packageType: 'goods',
  description: '',
  registrationDate: todayISODate(),
  status: 'registered',
})

const toInput = (s: Shipment): ShipmentInput => ({
  trackingNumber: s.trackingNumber,
  destinationCountry: s.destinationCountry,
  sender: { ...s.sender },
  receiver: { ...s.receiver },
  packageType: s.packageType,
  description: s.description,
  registrationDate: s.registrationDate,
  status: s.status,
})

function FormSection({ icon: Icon, title, hint, children }: { icon: LucideIcon; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 rounded-xl border bg-card p-5 shadow-sm sm:p-6 lg:grid-cols-3">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">{children}</div>
    </section>
  )
}

export function ShipmentForm({ shipment }: { shipment?: Shipment }) {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const isEdit = Boolean(shipment)
  const [values, setValues] = useState<ShipmentInput>(() => (shipment ? toInput(shipment) : emptyInput()))
  const [errors, setErrors] = useState<ShipmentFormErrors>({})
  const [trackingTaken, setTrackingTaken] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const errorText = (field: string) => {
    if (field === 'trackingNumber' && trackingTaken) return t.form.errors.trackingTaken
    const key = errors[field]
    return key ? t.form.errors[key] : undefined
  }

  const ariaFor = (field: string, id: string) => ({
    'aria-invalid': Boolean(errorText(field)) || undefined,
    'aria-describedby': errorText(field) ? `${id}-error` : undefined,
  })

  function setParty(party: 'sender' | 'receiver', key: 'name' | 'phone' | 'address', value: string) {
    setValues((v) => ({ ...v, [party]: { ...v[party], [key]: value } }))
    setErrors((e) => ({ ...e, [`${party}.${key}`]: undefined }))
  }

  function setField<K extends keyof ShipmentInput>(key: K, value: ShipmentInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
    if (key === 'trackingNumber') setTrackingTaken(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateShipmentInput(values)
    setErrors(nextErrors)
    const firstInvalid = Object.keys(nextErrors)[0]
    if (firstInvalid) {
      toast.error(t.form.errors.fixErrors)
      document.getElementById(firstInvalid.replace('.', '-'))?.focus()
      return
    }
    if (!user) return

    setSubmitting(true)
    try {
      if (shipment) {
        await shipmentService.update(shipment.id, values, user.id)
        await refreshShipments()
        toast.success(t.shipments.updated)
        router.push(`/dashboard/shipments/${shipment.id}`)
      } else {
        const created = await shipmentService.create(values, user.id)
        await refreshShipments()
        toast.success(interpolate(t.shipments.created, { number: created.trackingNumber }))
        router.push(`/dashboard/shipments/${created.id}`)
      }
    } catch (error) {
      if (error instanceof ShipmentServiceError && error.code === 'tracking_taken') {
        setTrackingTaken(true)
        document.getElementById('trackingNumber')?.focus()
      } else {
        toast.error(t.common.unexpectedError)
      }
      setSubmitting(false)
    }
  }

  const partyFields = (party: 'sender' | 'receiver') => (
    <>
      <FormField id={`${party}-name`} label={t.form.name} required error={errorText(`${party}.name`)}>
        <Input
          id={`${party}-name`}
          value={values[party].name}
          onChange={(e) => setParty(party, 'name', e.target.value)}
          autoComplete="off"
          className="h-10"
          {...ariaFor(`${party}.name`, `${party}-name`)}
        />
      </FormField>
      <FormField id={`${party}-phone`} label={t.form.phone} required error={errorText(`${party}.phone`)}>
        <Input
          id={`${party}-phone`}
          type="tel"
          dir="ltr"
          inputMode="tel"
          placeholder={t.form.phonePlaceholder}
          value={values[party].phone}
          onChange={(e) => setParty(party, 'phone', e.target.value)}
          className="h-10 rtl:text-end"
          {...ariaFor(`${party}.phone`, `${party}-phone`)}
        />
      </FormField>
      <FormField id={`${party}-address`} label={t.form.address} required error={errorText(`${party}.address`)} className="sm:col-span-2">
        <Textarea
          id={`${party}-address`}
          rows={2}
          placeholder={t.form.addressPlaceholder}
          value={values[party].address}
          onChange={(e) => setParty(party, 'address', e.target.value)}
          {...ariaFor(`${party}.address`, `${party}-address`)}
        />
      </FormField>
    </>
  )

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <FormSection icon={UserRound} title={t.form.senderSection} hint={t.form.senderHint}>
        {partyFields('sender')}
      </FormSection>

      <FormSection icon={UserRoundCheck} title={t.form.receiverSection} hint={t.form.receiverHint}>
        {partyFields('receiver')}
      </FormSection>

      <FormSection icon={Package} title={t.form.packageSection} hint={t.form.packageHint}>
        <FormField id="destinationCountry" label={t.form.destinationCountry} required error={errorText('destinationCountry')}>
          <select
            id="destinationCountry"
            value={values.destinationCountry}
            onChange={(event) => setField('destinationCountry', event.target.value)}
            aria-invalid={Boolean(errorText('destinationCountry')) || undefined}
            aria-describedby={errorText('destinationCountry') ? 'destinationCountry-error' : undefined}
            className={`h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${errorText('destinationCountry') ? 'border-destructive' : 'border-input'}`}
          >
            <option value="">{t.form.chooseDestinationCountry}</option>
            {destinationCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country[lang]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="trackingNumber"
          label={t.form.trackingNumber}
          optionalLabel={t.common.optional}
          hint={t.form.trackingHint}
          error={errorText('trackingNumber')}
        >
          <Input
            id="trackingNumber"
            dir="ltr"
            value={values.trackingNumber}
            onChange={(e) => setField('trackingNumber', e.target.value.toUpperCase())}
            maxLength={TRACKING_NUMBER_MAX_LENGTH}
            placeholder="MRQ240001900"
            spellCheck={false}
            className="h-10 font-mono rtl:text-end"
            {...ariaFor('trackingNumber', 'trackingNumber')}
          />
        </FormField>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">
            {t.form.packageType}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {PACKAGE_TYPES.map((type) => {
              const Icon = type === 'documents' ? FileText : Package
              const checked = values.packageType === type
              return (
                <label
                  key={type}
                  className={cn(
                    'flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                    checked ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
                  )}
                >
                  <input
                    type="radio"
                    name="packageType"
                    value={type}
                    checked={checked}
                    onChange={() => setField('packageType', type)}
                    className="sr-only"
                  />
                  <Icon className="size-4" aria-hidden="true" />
                  {t.packageTypes[type]}
                </label>
              )
            })}
          </div>
        </fieldset>

        <FormField id="registrationDate" label={t.form.registrationDate} required error={errorText('registrationDate')}>
          <Input
            id="registrationDate"
            type="date"
            value={values.registrationDate}
            onChange={(e) => setField('registrationDate', e.target.value)}
            className="h-10"
            {...ariaFor('registrationDate', 'registrationDate')}
          />
        </FormField>

        <FormField id="status" label={isEdit ? t.form.status : t.form.initialStatus} required>
          <StatusSelect id="status" value={values.status} onChange={(value) => setField('status', value)} />
        </FormField>

        <FormField id="description" label={t.form.description} optionalLabel={t.common.optional} className="sm:col-span-2">
          <Textarea
            id="description"
            rows={3}
            maxLength={500}
            placeholder={t.form.descriptionPlaceholder}
            value={values.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </FormField>
      </FormSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={shipment ? `/dashboard/shipments/${shipment.id}` : '/dashboard/shipments'}
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-5')}
        >
          {t.common.cancel}
        </Link>
        <Button type="submit" size="lg" disabled={submitting} className="px-5 font-semibold">
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {submitting ? t.common.saving : isEdit ? t.form.submitUpdate : t.form.submitCreate}
        </Button>
      </div>
    </form>
  )
}
