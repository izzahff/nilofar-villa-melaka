// Supabase Edge Function: records an availability check (status "enquiry").
// Deploy with `supabase functions deploy submit-enquiry --no-verify-jwt`.
// Secrets: TURNSTILE_SECRET (optional). SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
const str = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().slice(0, max) : '')
const int = (n: unknown, min: number, max: number) => {
  const v = Math.round(Number(n))
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad JSON' }, 400)
  }

  const secret = Deno.env.get('TURNSTILE_SECRET')
  if (secret) {
    const form = new FormData()
    form.append('secret', secret)
    form.append('response', str(body.turnstileToken, 4096))
    const ip = req.headers.get('CF-Connecting-IP')
    if (ip) form.append('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    const out = await res.json()
    if (!out.success) return json({ error: 'Pengesahan anti-spam gagal' }, 403)
  }

  const guest_name = str(body.guest_name, 120)
  const phone = str(body.phone, 20)
  if (guest_name.length < 2 || phone.replace(/\D/g, '').length < 7) {
    return json({ error: 'Nama dan nombor telefon diperlukan' }, 400)
  }
  if (!isDate(body.check_in) || !isDate(body.check_out) || body.check_out <= body.check_in) {
    return json({ error: 'Tarikh tidak sah' }, 400)
  }
  const today = new Date().toISOString().slice(0, 10)
  if (body.check_in < today) return json({ error: 'Tarikh check in sudah lepas' }, 400)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      guest_name,
      phone,
      origin: str(body.origin, 120) || null,
      adults: int(body.adults, 1, 60),
      children: int(body.children, 0, 60),
      check_in: body.check_in,
      check_out: body.check_out,
      remarks: str(body.remarks, 1000) || null,
      total_price: Math.max(0, Number(body.estimate) || 0),
      status: 'enquiry',
      source: 'Website',
    })
    .select('ref')
    .single()

  if (error) return json({ error: error.message }, 400)
  return json({ ref: data.ref })
})
