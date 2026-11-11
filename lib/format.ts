import type { Language } from '@/lib/i18n'

const locales: Record<Language, string> = { en: 'en-GB', fa: 'fa-IR' }

export function formatDate(value: string, lang: Language) {
  const date = value.length === 10 ? new Date(`${value}T00:00:00.000Z`) : new Date(value)
  return new Intl.DateTimeFormat(locales[lang], { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

export function formatDateTime(value: string, lang: Language) {
  return new Intl.DateTimeFormat(locales[lang], {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export function formatNumber(value: number, lang: Language) {
  return new Intl.NumberFormat(locales[lang]).format(value)
}

export function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''))
}

/** "Ahmad Karimi" -> "Ahmad K." — limited name display for public tracking. */
export function maskName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return parts[0] ? `${parts[0].charAt(0)}***` : ''
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

export function initials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}
