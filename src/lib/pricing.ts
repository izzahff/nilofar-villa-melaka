import { addDays, differenceInCalendarDays, format, getDay, parseISO } from 'date-fns'
import type { BusyRange, PriceSettings } from './types'

export const iso = (d: Date) => format(d, 'yyyy-MM-dd')
export const todayIso = () => iso(new Date())

export function nightsBetween(checkIn: string, checkOut: string) {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))
}

/** Each night of the stay as yyyy-MM-dd, from check in up to the night before check out. */
export function stayNights(checkIn: string, checkOut: string): string[] {
  const out: string[] = []
  const n = nightsBetween(checkIn, checkOut)
  const start = parseISO(checkIn)
  for (let i = 0; i < n; i++) out.push(iso(addDays(start, i)))
  return out
}

export type RateCategory = 'weekday' | 'weekend'

/** Weekend rate when check in is Friday or Saturday, or any night is a holiday. */
export function rateCategory(checkIn: string, checkOut: string, holidays: Set<string>): RateCategory {
  const dow = getDay(parseISO(checkIn))
  if (dow === 5 || dow === 6) return 'weekend'
  if (stayNights(checkIn, checkOut).some((n) => holidays.has(n))) return 'weekend'
  return 'weekday'
}

export interface Estimate {
  nights: number
  category: RateCategory
  total: number
  isEstimate: boolean
  label: string
}

export function estimatePrice(
  checkIn: string,
  checkOut: string,
  prices: PriceSettings,
  holidays: Set<string>,
): Estimate | null {
  const nights = nightsBetween(checkIn, checkOut)
  if (!(nights > 0)) return null
  const category = rateCategory(checkIn, checkOut, holidays)
  const r = prices[category]
  let total: number
  if (nights === 1) total = r.one
  else total = r.two + (nights - 2) * r.extra
  const label = nights === 1 ? '2H1M' : nights === 2 ? '3H2M' : `${nights + 1}H${nights}M`
  return { nights, category, total, isEstimate: nights > 2, label }
}

export interface StayCheck {
  ok: boolean
  reason?: string
}

/** Weekend stays need 2 nights unless check in is within the last minute window. */
export function checkMinimumStay(
  checkIn: string,
  checkOut: string,
  prices: PriceSettings,
  holidays: Set<string>,
  today = todayIso(),
): StayCheck {
  const nights = nightsBetween(checkIn, checkOut)
  if (nights < 1) return { ok: false, reason: 'Pilih tarikh check out selepas check in.' }
  if (checkIn < today) return { ok: false, reason: 'Tarikh check in sudah lepas.' }
  const lastMinute = nightsBetween(today, checkIn) <= prices.last_minute_days
  if (nights === 1 && rateCategory(checkIn, checkOut, holidays) === 'weekend' && !lastMinute) {
    return { ok: false, reason: 'Hujung minggu dan cuti umum minimum 2 malam.' }
  }
  return { ok: true }
}

/** Set of busy nights (yyyy-MM-dd) from busy ranges. */
export function busyNightSet(ranges: BusyRange[]): Set<string> {
  const set = new Set<string>()
  for (const r of ranges) for (const n of stayNights(r.start_date, r.end_date)) set.add(n)
  return set
}

export function isRangeFree(checkIn: string, checkOut: string, busy: Set<string>) {
  return stayNights(checkIn, checkOut).every((n) => !busy.has(n))
}

export function rangesOverlap(aIn: string, aOut: string, bIn: string, bOut: string) {
  return aIn < bOut && bIn < aOut
}
