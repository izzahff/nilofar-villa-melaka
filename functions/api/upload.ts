// Cloudflare Pages Function: upload and delete public images in R2.
// POST /api/upload   multipart form { file, folder: gallery|tour|splat }  -> { url, key }
// The splat folder holds Gaussian splat scans for the 3D tour (up to 90 MB, under the 100 MB request limit).
// DELETE /api/upload?key=gallery/...                              -> 204
import { type Ctx, isAdmin, json } from '../_shared'

const FOLDERS = ['gallery', 'tour', 'splat']
const SPLAT_EXT = ['spz', 'ply', 'splat', 'ksplat', 'sog']
const MAX_SPLAT = 90 * 1024 * 1024
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }
const MAX = 15 * 1024 * 1024

export async function onRequestPost({ request, env }: Ctx) {
  if (!(await isAdmin(request, env))) return json({ error: 'Tidak dibenarkan' }, 401)
  const form = await request.formData()
  const file = form.get('file')
  const folder = String(form.get('folder') ?? 'gallery')
  if (!(file instanceof File)) return json({ error: 'Tiada fail' }, 400)
  if (!FOLDERS.includes(folder)) return json({ error: 'Folder tidak sah' }, 400)
  let ext: string | undefined
  let contentType = file.type
  if (folder === 'splat') {
    ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !SPLAT_EXT.includes(ext)) return json({ error: 'Hanya fail imbasan .spz, .ply, .splat, .ksplat atau .sog' }, 415)
    if (file.size > MAX_SPLAT) return json({ error: 'Fail melebihi 90 MB. Eksport sebagai .spz atau guna pautan luar.' }, 413)
    contentType = 'application/octet-stream'
  } else {
    ext = TYPES[file.type]
    if (!ext) return json({ error: 'Hanya gambar JPG, PNG, WebP atau AVIF' }, 415)
    if (file.size > MAX) return json({ error: 'Fail melebihi 15 MB' }, 413)
  }

  const key = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
  await env.IMAGES.put(key, folder === 'splat' ? file.stream() : await file.arrayBuffer(), {
    httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
  })
  const base = (env.R2_PUBLIC_URL || '/img').replace(/\/$/, '')
  return json({ url: `${base}/${key}`, key })
}

export async function onRequestDelete({ request, env }: Ctx) {
  if (!(await isAdmin(request, env))) return json({ error: 'Tidak dibenarkan' }, 401)
  const key = new URL(request.url).searchParams.get('key') ?? ''
  if (!FOLDERS.some((f) => key.startsWith(`${f}/`)) || key.includes('..')) return json({ error: 'Kunci tidak sah' }, 400)
  await env.IMAGES.delete(key)
  return new Response(null, { status: 204 })
}
