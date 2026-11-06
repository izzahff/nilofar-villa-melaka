import { format, parseISO } from 'date-fns'
import { ms } from 'date-fns/locale'
import type { BookingStatus, BookingType, DocKind, MediaCategory, PaymentType } from './types'

export const rm = (n: number) =>
  'RM' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

export const rm2 = (n: number) =>
  'RM' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtDate = (d: string | null | undefined, pattern = 'd MMM yyyy') =>
  d ? format(parseISO(d), pattern, { locale: ms }) : '-'

export const fmtDay = (d: string) => format(parseISO(d), 'EEE, d MMM', { locale: ms })

export const fmtDateTime = (d: string | null | undefined) =>
  d ? format(new Date(d), 'd MMM yyyy, h:mm a', { locale: ms }) : '-'

export const STATUS_LABEL: Record<BookingStatus, string> = {
  enquiry: 'Semakan',
  pending: 'Menunggu deposit',
  deposit_paid: 'Deposit diterima',
  fully_paid: 'Dibayar penuh',
  checked_in: 'Check in',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}

export const STATUS_SHORT: Record<BookingStatus, string> = {
  enquiry: 'Semakan',
  pending: 'Pending',
  deposit_paid: 'Deposit',
  fully_paid: 'Penuh',
  checked_in: 'Check in',
  completed: 'Selesai',
  cancelled: 'Batal',
}

export const STATUS_ORDER: BookingStatus[] = [
  'enquiry',
  'pending',
  'deposit_paid',
  'fully_paid',
  'checked_in',
  'completed',
  'cancelled',
]

/** Tailwind classes for status chips and calendar bars */
export const STATUS_STYLE: Record<BookingStatus, string> = {
  enquiry: 'bg-sky-100 text-sky-800 ring-sky-200',
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  deposit_paid: 'bg-orange-100 text-orange-800 ring-orange-200',
  fully_paid: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  checked_in: 'bg-violet-100 text-violet-800 ring-violet-200',
  completed: 'bg-stone-200 text-stone-700 ring-stone-300',
  cancelled: 'bg-rose-100 text-rose-700 ring-rose-200 line-through',
}

export const STATUS_DOT: Record<BookingStatus, string> = {
  enquiry: 'bg-sky-500',
  pending: 'bg-amber-500',
  deposit_paid: 'bg-orange-500',
  fully_paid: 'bg-emerald-600',
  checked_in: 'bg-violet-600',
  completed: 'bg-stone-500',
  cancelled: 'bg-rose-500',
}

export const ACTIVE_STATUSES: BookingStatus[] = ['pending', 'deposit_paid', 'fully_paid', 'checked_in', 'completed']

export const TYPE_LABEL: Record<BookingType, string> = {
  standard: 'Biasa',
  event: 'Majlis',
  special: 'Khas / korporat',
}

export const PAYMENT_LABEL: Record<PaymentType, string> = {
  deposit: 'Deposit keselamatan',
  rental: 'Bayaran sewa',
  late_checkout: 'Lewat check out',
  deposit_refund: 'Pulangan deposit',
  deposit_deduction: 'Potongan deposit (kerosakan)',
}

export const DOC_LABEL: Record<DocKind, string> = {
  deposit_slip: 'Resit deposit',
  payment_slip: 'Resit bayaran',
  signed_agreement: 'Perjanjian bertandatangan',
  local_order: 'Local Order / surat',
  other: 'Lain-lain',
}

export const MEDIA_LABEL: Record<MediaCategory, string> = {
  luar: 'Luar rumah',
  'ruang-tamu': 'Ruang tamu',
  dapur: 'Dapur',
  bilik: 'Bilik',
  kolam: 'Kolam',
  lain: 'Lain-lain',
}

export const SOURCES = ['Facebook', 'Instagram', 'TikTok', 'Google', 'Kawan / saudara', 'Datang semula', 'Website', 'Lain-lain']
