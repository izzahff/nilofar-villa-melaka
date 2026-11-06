import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      remove: (id: string) => void
    }
  }
}

export const TURNSTILE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || ''

let loader: Promise<void> | null = null
function loadScript() {
  if (window.turnstile) return Promise.resolve()
  loader ??= new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => res()
    s.onerror = rej
    document.head.appendChild(s)
  })
  return loader
}

/** Cloudflare Turnstile widget. Renders nothing when no site key is set. */
export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!TURNSTILE_KEY) return
    let id: string | undefined
    loadScript().then(() => {
      if (!ref.current || !window.turnstile) return
      id = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_KEY,
        callback: onToken,
        'expired-callback': () => onToken(''),
        theme: 'light',
        language: 'ms',
      })
    })
    return () => {
      if (id && window.turnstile) window.turnstile.remove(id)
    }
  }, [onToken])
  if (!TURNSTILE_KEY) return null
  return <div ref={ref} className="min-h-[65px]" />
}
