import type { jsPDF } from 'jspdf'

/**
 * Shares a PDF. On phones that support the Web Share API this opens the share
 * sheet so the owner can pick WhatsApp and send the file itself. Elsewhere the
 * PDF downloads and the fallback link (usually WhatsApp text) opens.
 */
export async function sharePdf(doc: jsPDF, filename: string, text: string, fallbackUrl?: string) {
  const blob = doc.output('blob')
  const file = new File([blob], filename, { type: 'application/pdf' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text, title: filename })
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
    }
  }
  doc.save(filename)
  if (fallbackUrl) window.open(fallbackUrl, '_blank')
}

export function siteUrl() {
  return ((import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin + import.meta.env.BASE_URL).replace(/\/$/, '')
}
