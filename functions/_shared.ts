// Minimal types so this folder needs no extra packages.
export interface R2ObjectBody {
  body: ReadableStream
  httpEtag: string
  httpMetadata?: { contentType?: string; cacheControl?: string }
}
export interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream, opts?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>
  get(key: string): Promise<R2ObjectBody | null>
  delete(key: string): Promise<void>
}
export interface Env {
  IMAGES: R2Bucket
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  /** Optional public bucket domain, e.g. https://img.nilofarvilla.com. Defaults to /img on this site. */
  R2_PUBLIC_URL?: string
}
export interface Ctx {
  request: Request
  env: Env
  params: Record<string, string | string[]>
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** True when the bearer token belongs to a user listed in public.admins. */
export async function isAdmin(request: Request, env: Env): Promise<boolean> {
  const auth = request.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return false
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/is_admin`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: auth, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!res.ok) return false
  return (await res.json()) === true
}
