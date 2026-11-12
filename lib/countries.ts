import type { Language } from '@/lib/i18n'

export const destinationCountries = [
  { code: 'AF', en: 'Afghanistan', fa: 'افغانستان' },
  { code: 'AE', en: 'United Arab Emirates', fa: 'امارات متحده عربی' },
  { code: 'AU', en: 'Australia', fa: 'استرالیا' },
  { code: 'AT', en: 'Austria', fa: 'اتریش' },
  { code: 'BE', en: 'Belgium', fa: 'بلجیم' },
  { code: 'CA', en: 'Canada', fa: 'کانادا' },
  { code: 'CN', en: 'China', fa: 'چین' },
  { code: 'FR', en: 'France', fa: 'فرانسه' },
  { code: 'DE', en: 'Germany', fa: 'آلمان' },
  { code: 'IN', en: 'India', fa: 'هند' },
  { code: 'IR', en: 'Iran', fa: 'ایران' },
  { code: 'IT', en: 'Italy', fa: 'ایتالیا' },
  { code: 'JP', en: 'Japan', fa: 'جاپان' },
  { code: 'MY', en: 'Malaysia', fa: 'مالیزیا' },
  { code: 'NL', en: 'Netherlands', fa: 'هالند' },
  { code: 'PK', en: 'Pakistan', fa: 'پاکستان' },
  { code: 'SA', en: 'Saudi Arabia', fa: 'عربستان سعودی' },
  { code: 'ES', en: 'Spain', fa: 'اسپانیا' },
  { code: 'CH', en: 'Switzerland', fa: 'سویس' },
  { code: 'TR', en: 'Türkiye', fa: 'ترکیه' },
  { code: 'GB', en: 'United Kingdom', fa: 'بریتانیا' },
  { code: 'US', en: 'United States', fa: 'ایالات متحده' },
] as const

export function getCountryName(code: string, lang: Language) {
  return destinationCountries.find((country) => country.code === code)?.[lang] ?? code
}
