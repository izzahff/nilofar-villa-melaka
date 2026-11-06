import type { BookingStatus, Holiday } from './types'

export const SEED_HOLIDAYS: Omit<Holiday, 'id'>[] = [
  { date: '2026-12-25', name: 'Hari Krismas', kind: 'public' },
  { date: '2027-01-01', name: 'Tahun Baru', kind: 'public' },
  { date: '2027-04-15', name: 'Hari Bandaraya Bersejarah Melaka', kind: 'public' },
  { date: '2027-05-01', name: 'Hari Pekerja', kind: 'public' },
  { date: '2027-08-31', name: 'Hari Kebangsaan', kind: 'public' },
  { date: '2027-09-16', name: 'Hari Malaysia', kind: 'public' },
  { date: '2027-12-25', name: 'Hari Krismas', kind: 'public' },
]

const NOTE = 'Import dari senarai 1 Nov 2026. Sahkan harga, telefon dan status.'

export const SEED_BOOKINGS: {
  guest_name: string
  origin: string | null
  check_in: string
  check_out: string
  status: BookingStatus
  notes: string
}[] = [
  { guest_name: 'KEMAS', origin: null, check_in: '2026-11-15', check_out: '2026-11-16', status: 'deposit_paid', notes: NOTE },
  { guest_name: 'Norain', origin: 'Pt Raja', check_in: '2026-12-11', check_out: '2026-12-13', status: 'deposit_paid', notes: NOTE },
  { guest_name: 'Nurizzuan', origin: 'Kelantan', check_in: '2026-12-21', check_out: '2026-12-22', status: 'deposit_paid', notes: NOTE },
  { guest_name: 'Salahuddin', origin: null, check_in: '2026-12-25', check_out: '2026-12-27', status: 'deposit_paid', notes: NOTE },
  { guest_name: 'Zul', origin: 'Shah Alam', check_in: '2027-01-01', check_out: '2027-01-03', status: 'deposit_paid', notes: NOTE },
  { guest_name: 'Zaireen', origin: 'Ampang', check_in: '2027-03-10', check_out: '2027-03-14', status: 'deposit_paid', notes: NOTE },
]
