// Serves public images from R2 at /img/<key> when no public bucket domain is set.
import type { Ctx } from '../_shared'

export async function onRequestGet({ env, params }: Ctx) {
  const key = Array.isArray(params.path) ? params.path.join('/') : String(params.path ?? '')
  if (!/^(gallery|tour)\//.test(key) || key.includes('..')) return new Response('Not found', { status: 404 })
  const obj = await env.IMAGES.get(key)
  if (!obj) return new Response('Not found', { status: 404 })
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: obj.httpEtag,
    },
  })
}
