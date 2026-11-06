import type {
  Agreement,
  AllSettings,
  AuditEntry,
  BlockedDate,
  Booking,
  BookingInput,
  BusyRange,
  DocKind,
  DocumentRow,
  Holiday,
  MediaItem,
  Payment,
  PaymentInput,
  SettingKey,
  TourScene,
} from '../types'

export interface EnquiryInput {
  guest_name: string
  phone: string
  origin: string
  adults: number
  children: number
  check_in: string
  check_out: string
  remarks: string
  estimate: number
  turnstileToken?: string
}

export interface BookingForm {
  ref: string
  guest_name: string
  phone: string | null
  origin: string | null
  address: string | null
  adults: number
  children: number
  check_in: string
  check_out: string
  source: string | null
  remarks: string | null
  registered_at: string | null
  deposit_amount: number
  total_price: number
}

export interface RegistrationInput {
  guest_name: string
  address: string
  phone: string
  adults: number
  children: number
  source: string
  remarks: string
}

export interface SessionUser {
  id: string
  email: string
}

export interface Api {
  mode: 'supabase' | 'demo'

  // Public
  getPublicSettings(): Promise<Partial<AllSettings>>
  getHolidays(): Promise<Holiday[]>
  getBusyRanges(from: string, to: string): Promise<BusyRange[]>
  submitEnquiry(input: EnquiryInput): Promise<{ ref: string | null }>
  getBookingForm(token: string): Promise<BookingForm | null>
  submitRegistration(token: string, input: RegistrationInput): Promise<string>
  uploadSlip(token: string, file: File): Promise<void>
  listMedia(includeHidden?: boolean): Promise<MediaItem[]>
  listTourScenes(): Promise<TourScene[]>

  // Auth
  getUser(): Promise<SessionUser | null>
  signIn(email: string, password: string): Promise<SessionUser>
  signOut(): Promise<void>
  onAuthChange(cb: (u: SessionUser | null) => void): () => void
  isAdmin(): Promise<boolean>

  // Admin
  getAllSettings(): Promise<Partial<AllSettings>>
  saveSetting<K extends SettingKey>(key: K, value: AllSettings[K]): Promise<void>
  listBookings(): Promise<Booking[]>
  getBooking(id: string): Promise<Booking | null>
  createBooking(input: BookingInput): Promise<Booking>
  updateBooking(id: string, patch: Partial<BookingInput>): Promise<Booking>
  deleteBooking(id: string): Promise<void>
  listPayments(bookingId?: string): Promise<Payment[]>
  addPayment(input: PaymentInput): Promise<Payment>
  deletePayment(id: string): Promise<void>
  listBlocks(): Promise<BlockedDate[]>
  addBlock(start: string, end: string, reason: string): Promise<BlockedDate>
  deleteBlock(id: string): Promise<void>
  saveHoliday(h: Omit<Holiday, 'id'> & { id?: string }): Promise<Holiday>
  deleteHoliday(id: string): Promise<void>
  getAgreement(bookingId: string): Promise<Agreement | null>
  saveAgreement(a: Agreement): Promise<void>
  listDocuments(bookingId: string): Promise<DocumentRow[]>
  uploadDocument(bookingId: string, kind: DocKind, file: File): Promise<DocumentRow>
  getDocumentUrl(path: string): Promise<string>
  deleteDocument(doc: DocumentRow): Promise<void>
  uploadImage(file: File, folder: 'gallery' | 'tour'): Promise<{ url: string; key: string | null }>
  deleteImage(key: string | null): Promise<void>
  saveMedia(item: Partial<MediaItem> & { url: string }): Promise<MediaItem>
  deleteMedia(item: MediaItem): Promise<void>
  saveTourScene(scene: Partial<TourScene> & { name: string; image_url: string }): Promise<TourScene>
  deleteTourScene(scene: TourScene): Promise<void>
  listAudit(limit?: number): Promise<AuditEntry[]>
}

/** Turns database errors into Malay messages people can act on. */
export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e)
  if (/no_overlap|exclusion|bertindih/i.test(msg)) return 'Tarikh bertindih dengan tempahan atau blok lain.'
  if (/Invalid login credentials/i.test(msg)) return 'Emel atau kata laluan salah.'
  if (/bookings_dates|end_date > start_date|check_out > check_in/i.test(msg)) return 'Tarikh keluar mesti selepas tarikh masuk.'
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Tiada sambungan internet. Cuba lagi.'
  return msg
}
