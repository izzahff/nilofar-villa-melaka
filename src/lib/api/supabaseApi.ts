import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { PUBLIC_SETTING_KEYS } from '../types'
import type { AllSettings, BlockedDate, Booking, DocumentRow, Holiday, MediaItem, Payment, SettingKey, TourScene } from '../types'
import type { Api, BookingForm, SessionUser } from './types'

const BOOKING_COLS = '*'

function check<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error
  return res.data
}

function settingsFromRows(rows: { key: string; value: unknown }[]): Partial<AllSettings> {
  const out: Record<string, unknown> = {}
  for (const r of rows) out[r.key] = r.value
  return out as Partial<AllSettings>
}

const safeName = (name: string) => name.normalize('NFKD').replace(/[^\w.-]+/g, '_').slice(-80)

export function createSupabaseApi(url: string, anonKey: string): Api {
  const sb: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  const BUCKET = 'private-docs'
  const uploadBase = (import.meta.env.VITE_UPLOAD_ENDPOINT as string | undefined) || '/api/upload'

  const toUser = (u: { id: string; email?: string } | null | undefined): SessionUser | null =>
    u ? { id: u.id, email: u.email ?? '' } : null

  async function authHeader() {
    const { data } = await sb.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Sila log masuk semula.')
    return { Authorization: `Bearer ${token}` }
  }

  return {
    mode: 'supabase',

    async getPublicSettings() {
      const rows = check(await sb.from('settings').select('key, value').eq('is_public', true))
      return settingsFromRows(rows ?? [])
    },
    async getHolidays() {
      return check(await sb.from('holidays').select('*').order('date')) ?? []
    },
    async getBusyRanges(from, to) {
      return check(await sb.rpc('get_busy_ranges', { p_from: from, p_to: to })) ?? []
    },
    async submitEnquiry(input) {
      const { data, error } = await sb.functions.invoke('submit-enquiry', { body: input })
      if (error) {
        console.warn('submit-enquiry failed', error)
        return { ref: null }
      }
      return { ref: (data as { ref?: string })?.ref ?? null }
    },
    async getBookingForm(token) {
      if (!/^[0-9a-f-]{36}$/i.test(token)) return null
      const data = check(await sb.rpc('get_booking_form', { p_token: token }))
      return (data as BookingForm | null) ?? null
    },
    async submitRegistration(token, i) {
      return check(
        await sb.rpc('submit_registration', {
          p_token: token,
          p_guest_name: i.guest_name,
          p_address: i.address,
          p_phone: i.phone,
          p_adults: i.adults,
          p_children: i.children,
          p_source: i.source,
          p_remarks: i.remarks,
        }),
      ) as string
    },
    async uploadSlip(token, file) {
      const path = `slips/${token}/${Date.now()}-${safeName(file.name)}`
      check(await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type }))
      check(await sb.rpc('register_slip', { p_token: token, p_path: path, p_file_name: file.name }))
    },
    async listMedia(includeHidden = false) {
      let q = sb.from('media').select('*').order('sort').order('created_at')
      if (!includeHidden) q = q.eq('visible', true)
      return check(await q) ?? []
    },
    async listTourScenes() {
      return check(await sb.from('tour_scenes').select('*').order('sort')) ?? []
    },

    async getUser() {
      const { data } = await sb.auth.getSession()
      return toUser(data.session?.user)
    },
    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw error
      return toUser(data.user)!
    },
    async signOut() {
      await sb.auth.signOut()
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)))
      return () => data.subscription.unsubscribe()
    },
    async isAdmin() {
      const { data } = await sb.rpc('is_admin')
      return data === true
    },

    async getAllSettings() {
      return settingsFromRows(check(await sb.from('settings').select('key, value')) ?? [])
    },
    async saveSetting(key: SettingKey, value) {
      const isPublic = PUBLIC_SETTING_KEYS.includes(key)
      check(await sb.from('settings').upsert({ key, value, is_public: isPublic }))
    },
    async listBookings() {
      return check(await sb.from('bookings').select(BOOKING_COLS).order('check_in', { ascending: false })) ?? []
    },
    async getBooking(id) {
      return check(await sb.from('bookings').select(BOOKING_COLS).eq('id', id).maybeSingle()) as Booking | null
    },
    async createBooking(input) {
      return check(await sb.from('bookings').insert(input).select(BOOKING_COLS).single()) as Booking
    },
    async updateBooking(id, patch) {
      return check(await sb.from('bookings').update(patch).eq('id', id).select(BOOKING_COLS).single()) as Booking
    },
    async deleteBooking(id) {
      check(await sb.from('bookings').delete().eq('id', id))
    },
    async listPayments(bookingId) {
      let q = sb.from('payments').select('*').order('paid_at')
      if (bookingId) q = q.eq('booking_id', bookingId)
      return check(await q) ?? []
    },
    async addPayment(input) {
      return check(await sb.from('payments').insert(input).select('*').single()) as Payment
    },
    async deletePayment(id) {
      check(await sb.from('payments').delete().eq('id', id))
    },
    async listBlocks() {
      return check(await sb.from('blocked_dates').select('*').order('start_date')) ?? []
    },
    async addBlock(start_date, end_date, reason) {
      return check(await sb.from('blocked_dates').insert({ start_date, end_date, reason }).select('*').single()) as BlockedDate
    },
    async deleteBlock(id) {
      check(await sb.from('blocked_dates').delete().eq('id', id))
    },
    async saveHoliday(h) {
      return check(await sb.from('holidays').upsert(h).select('*').single()) as Holiday
    },
    async deleteHoliday(id) {
      check(await sb.from('holidays').delete().eq('id', id))
    },
    async getAgreement(bookingId) {
      return check(await sb.from('agreements').select('*').eq('booking_id', bookingId).maybeSingle())
    },
    async saveAgreement(a) {
      check(await sb.from('agreements').upsert(a))
    },
    async listDocuments(bookingId) {
      return check(await sb.from('documents').select('*').eq('booking_id', bookingId).order('created_at')) ?? []
    },
    async uploadDocument(bookingId, kind, file) {
      const path = `bookings/${bookingId}/${Date.now()}-${safeName(file.name)}`
      check(await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type }))
      return check(
        await sb.from('documents').insert({ booking_id: bookingId, kind, path, file_name: file.name }).select('*').single(),
      ) as DocumentRow
    },
    async getDocumentUrl(path) {
      const data = check(await sb.storage.from(BUCKET).createSignedUrl(path, 300))
      if (!data) throw new Error('Fail tidak dijumpai')
      return data.signedUrl
    },
    async deleteDocument(doc) {
      check(await sb.storage.from(BUCKET).remove([doc.path]))
      check(await sb.from('documents').delete().eq('id', doc.id))
    },
    async uploadImage(file, folder) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      const res = await fetch(uploadBase, { method: 'POST', body: fd, headers: await authHeader() })
      if (!res.ok) throw new Error((await res.text()) || `Muat naik gagal (${res.status})`)
      return (await res.json()) as { url: string; key: string }
    },
    async uploadSplat(file) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'splat')
      const res = await fetch(uploadBase, { method: 'POST', body: fd, headers: await authHeader() })
      if (!res.ok) {
        const body = await res.text()
        let msg = body
        try {
          msg = (JSON.parse(body) as { error?: string }).error ?? body
        } catch {
          /* plain text */
        }
        throw new Error(msg || `Muat naik gagal (${res.status})`)
      }
      return (await res.json()) as { url: string; key: string }
    },
    async deleteImage(key) {
      if (!key) return
      const res = await fetch(`${uploadBase}?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: await authHeader(),
      })
      if (!res.ok && res.status !== 404) throw new Error(await res.text())
    },
    async saveMedia(item) {
      return check(await sb.from('media').upsert(item).select('*').single()) as MediaItem
    },
    async deleteMedia(item) {
      await this.deleteImage(item.r2_key)
      check(await sb.from('media').delete().eq('id', item.id))
    },
    async saveTourScene(scene) {
      return check(await sb.from('tour_scenes').upsert(scene).select('*').single()) as TourScene
    },
    async deleteTourScene(scene) {
      await this.deleteImage(scene.r2_key)
      check(await sb.from('tour_scenes').delete().eq('id', scene.id))
    },
    async listAudit(limit = 100) {
      return check(await sb.from('audit_log').select('*').order('at', { ascending: false }).limit(limit)) ?? []
    },
  }
}
