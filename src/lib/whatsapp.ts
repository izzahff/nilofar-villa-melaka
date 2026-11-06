import { subDays, parseISO } from 'date-fns'
import { fmtDate } from './format'
import type { AllSettings, Booking } from './types'
import { iso } from './pricing'

/** Normalise a Malaysian phone number to international digits (60...). */
export function toIntl(phone: string | null | undefined): string {
  const d = (phone ?? '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('60')) return d
  if (d.startsWith('0')) return '6' + d
  return '60' + d
}

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${toIntl(phone)}?text=${encodeURIComponent(text)}`

export function fillTemplate(tpl: string, vars: Record<string, string | number>) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}

export function bookingVars(
  b: Booking,
  s: AllSettings,
  extra: { balance?: number; formUrl?: string } = {},
): Record<string, string | number> {
  const due = iso(subDays(parseISO(b.check_in), s.prices.full_payment_days_before))
  return {
    nama: b.guest_name,
    ref: b.ref,
    checkin: fmtDate(b.check_in),
    checkout: fmtDate(b.check_out),
    malam: b.nights,
    jumlah: Number(b.total_price).toLocaleString('en-MY'),
    deposit: Number(b.deposit_amount).toLocaleString('en-MY'),
    baki: Number(extra.balance ?? b.total_price).toLocaleString('en-MY'),
    tarikh_akhir: fmtDate(due),
    bank: s.bank.bank,
    akaun: s.bank.account,
    pemegang: s.bank.holder,
    pautan: extra.formUrl ?? '',
    masa_checkin: s.site.checkin_time,
    masa_checkout: s.site.checkout_time,
    peta: s.contacts.google_maps,
  }
}
