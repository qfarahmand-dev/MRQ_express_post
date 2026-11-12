import type { ShipmentInput } from '@/types/shipment'

export const TRACKING_NUMBER_MAX_LENGTH = 25

export type FieldErrorKey = 'required' | 'phone' | 'trackingLength' | 'trackingFormat'

export type ShipmentFormErrors = Partial<Record<string, FieldErrorKey>>

/** Converts Persian and Arabic-Indic digits to ASCII digits. */
export function normalizeDigits(value: string) {
  return value
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
}

export function isValidPhone(value: string) {
  const normalized = normalizeDigits(value.trim())
  if (!/^\+?[0-9\s\-()]+$/.test(normalized)) return false
  const digits = normalized.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export function normalizeTrackingNumber(value: string) {
  return normalizeDigits(value).trim().toUpperCase()
}

export function validateShipmentInput(input: ShipmentInput): ShipmentFormErrors {
  const errors: ShipmentFormErrors = {}
  const requiredText: [string, string][] = [
    ['destinationCountry', input.destinationCountry],
    ['sender.name', input.sender.name],
    ['sender.address', input.sender.address],
    ['receiver.name', input.receiver.name],
    ['receiver.address', input.receiver.address],
    ['registrationDate', input.registrationDate],
  ]
  for (const [field, value] of requiredText) {
    if (!value.trim()) errors[field] = 'required'
  }

  for (const field of ['sender', 'receiver'] as const) {
    const phone = input[field].phone
    if (!phone.trim()) errors[`${field}.phone`] = 'required'
    else if (!isValidPhone(phone)) errors[`${field}.phone`] = 'phone'
  }

  const tracking = normalizeTrackingNumber(input.trackingNumber)
  if (tracking.length > TRACKING_NUMBER_MAX_LENGTH) errors.trackingNumber = 'trackingLength'
  else if (tracking && !/^[A-Z0-9-]+$/.test(tracking)) errors.trackingNumber = 'trackingFormat'

  return errors
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
