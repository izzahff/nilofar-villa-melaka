import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fmtDate, fmtDateTime, PAYMENT_LABEL, rm2, TYPE_LABEL } from './format'
import { summarize } from './money'
import type { Agreement, AllSettings, Booking, Payment } from './types'

const FOREST: [number, number, number] = [75, 46, 30]
const GOLD: [number, number, number] = [201, 168, 74]
const INK: [number, number, number] = [42, 29, 21]
const MUTED: [number, number, number] = [110, 98, 90]

function header(doc: jsPDF, s: AllSettings, title: string, sub: string) {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(...FOREST)
  doc.rect(0, 0, w, 34, 'F')
  // mark
  doc.setFillColor(...GOLD)
  doc.circle(20, 17, 7, 'F')
  doc.setFillColor(180, 85, 58)
  doc.circle(20, 20, 3.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('times', 'bold')
  doc.setFontSize(18)
  doc.text(s.site.name, 31, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(w < 160 ? 7.5 : 8.5)
  doc.setTextColor(230, 222, 205)
  const maxW = w - 31 - 46
  const addr = doc.splitTextToSize(s.site.address, maxW) as string[]
  doc.text(addr.slice(0, 2), 31, 20.5)
  const contactY = 20.5 + Math.min(addr.length, 2) * 3.6
  doc.text(doc.splitTextToSize(s.contacts.whatsapp.map((c) => `${c.name} +${c.phone}`).join('  |  '), maxW).slice(0, 1), 31, contactY)
  doc.setTextColor(...GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(title, w - 14, 15, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(sub, w - 14, 21, { align: 'right' })
}

function footer(doc: jsPDF, s: AllSettings) {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...GOLD)
    doc.line(14, h - 16, w - 14, h - 16)
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`${s.site.name} · "${s.site.motto}"`, 14, h - 10)
    doc.text(`Muka ${i}/${pages}`, w - 14, h - 10, { align: 'right' })
  }
}

function label(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.setFont('helvetica', 'normal')
  doc.text(text.toUpperCase(), x, y)
}

function value(doc: jsPDF, text: string, x: number, y: number, size = 10.5, bold = false) {
  doc.setFontSize(size)
  doc.setTextColor(...INK)
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.text(text, x, y)
}

/** Receipt for one payment, with the booking's running totals. */
export function receiptPdf(s: AllSettings, b: Booking, p: Payment, all: Payment[]) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  const w = doc.internal.pageSize.getWidth()
  const isRefund = p.type === 'deposit_refund'
  header(doc, s, isRefund ? 'BAUCAR BAYARAN BALIK' : 'RESIT RASMI', p.receipt_no)

  let y = 46
  label(doc, 'Diterima daripada', 14, y)
  label(doc, 'Tarikh', w - 60, y)
  value(doc, b.guest_name, 14, y + 5.5, 11, true)
  value(doc, fmtDateTime(p.paid_at), w - 60, y + 5.5, 9.5)
  y += 14
  label(doc, 'No. tempahan', 14, y)
  label(doc, 'Tempoh menginap', w - 60, y)
  value(doc, b.ref, 14, y + 5.5)
  value(doc, `${fmtDate(b.check_in)} - ${fmtDate(b.check_out)}`, w - 60, y + 5.5, 9.5)
  y += 10

  autoTable(doc, {
    startY: y + 2,
    margin: { left: 14, right: 14 },
    head: [['Perkara', 'Kaedah', 'Amaun']],
    body: [[`${PAYMENT_LABEL[p.type]}${p.notes ? `\n${p.notes}` : ''}`, `${p.method}${p.reference ? `\nRuj: ${p.reference}` : ''}`, rm2(p.amount)]],
    theme: 'grid',
    headStyles: { fillColor: FOREST, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9.5, textColor: INK, cellPadding: 3 },
    columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
  })

  // Summary on the receipt date
  const upto = all.filter((x) => x.paid_at <= p.paid_at)
  const m = summarize(b, upto)
  const rows: [string, string][] = [
    ['Harga sewa', rm2(b.total_price)],
    ['Sewa telah dibayar', rm2(m.rentPaid)],
    ['Baki sewa', rm2(m.rentBalance)],
    ['Deposit keselamatan dipegang', rm2(m.depositHeld)],
  ]
  if (m.lateFees) rows.push(['Caj lewat check out', rm2(m.lateFees)])
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4,
    margin: { left: w / 2 - 4, right: 14 },
    body: rows,
    theme: 'plain',
    bodyStyles: { fontSize: 9, textColor: INK, cellPadding: 1.4 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  doc.setFillColor(247, 242, 233)
  doc.roundedRect(14, y, w - 28, 22, 2, 2, 'F')
  label(doc, 'Akaun bayaran', 18, y + 6)
  value(doc, `${s.bank.bank}  ${s.bank.account}`, 18, y + 12, 10, true)
  value(doc, s.bank.holder, 18, y + 17.5, 9)

  y += 30
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  const note = doc.splitTextToSize(
    `Resit ini dijana oleh sistem dan sah tanpa tandatangan. Deposit keselamatan dipulangkan dalam 24 jam selepas check out jika tiada kerosakan atau kehilangan. Check in ${s.site.checkin_time}, check out ${s.site.checkout_time}.`,
    w - 28,
  )
  doc.text(note, 14, y)
  footer(doc, s)
  return doc
}

/** Agreement for special or long stay bookings. */
export function agreementPdf(s: AllSettings, b: Booking, a: Agreement) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const w = doc.internal.pageSize.getWidth()
  header(doc, s, 'PERJANJIAN PENGINAPAN', b.ref)
  let y = 46
  doc.setFont('times', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...FOREST)
  doc.text('Perjanjian Sewaan Penginapan Jangka Panjang', w / 2, y, { align: 'center' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text(`Bertarikh ${fmtDate(new Date().toISOString().slice(0, 10))}`, w / 2, y, { align: 'center' })

  autoTable(doc, {
    startY: y + 6,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Butiran', '']],
    headStyles: { fillColor: FOREST, textColor: 255 },
    bodyStyles: { fontSize: 9.5, textColor: INK, cellPadding: 2.6 },
    columnStyles: { 0: { cellWidth: 58, fontStyle: 'bold' } },
    body: [
      ['Pemilik (Pihak Pertama)', `${s.bank.holder}, ${s.site.name}\n${s.site.address}`],
      ['Penyewa (Pihak Kedua)', [a.party_name, a.representative && `Wakil: ${a.representative}${a.position ? `, ${a.position}` : ''}`, a.contact && `Hubungan: ${a.contact}`].filter(Boolean).join('\n')],
      ['No. rujukan penyewa', a.external_ref || b.external_ref || '-'],
      ['Jenis tempahan', TYPE_LABEL[b.booking_type]],
      ['Tempoh', `${fmtDate(b.check_in)} (${s.site.checkin_time}) hingga ${fmtDate(b.check_out)} (${s.site.checkout_time}), ${b.nights} malam`],
      ['Bilangan penghuni', `${b.adults} dewasa, ${b.children} kanak-kanak (maksimum ${s.site.capacity_max})`],
      ['Jumlah sewa dipersetujui', rm2(a.agreed_total || b.total_price)],
      ['Deposit keselamatan', `${rm2(b.deposit_amount)}, dipulangkan selepas check out tolak caj kerosakan atau kehilangan`],
      ['Akaun bayaran', `${s.bank.bank} ${s.bank.account} (${s.bank.holder})`],
    ],
  })

  if (a.schedule.length) {
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
      margin: { left: 14, right: 14 },
      theme: 'striped',
      head: [['#', 'Perkara', 'Tarikh akhir', { content: 'Amaun', styles: { halign: 'right' } }]],
      headStyles: { fillColor: GOLD, textColor: INK },
      bodyStyles: { fontSize: 9.5 },
      columnStyles: { 3: { halign: 'right' } },
      body: [
        ...a.schedule.map((it, i) => [String(i + 1), it.label, fmtDate(it.due_date), rm2(it.amount)]),
        ['', 'Jumlah', '', rm2(a.schedule.reduce((x, it) => x + Number(it.amount), 0))],
      ],
    })
  }

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  const terms = [
    `Pembatalan atau pertukaran tarikh mesti dimaklumkan sekurang-kurangnya ${Math.round(s.prices.cancel_days_before / 7)} minggu sebelum tarikh masuk. Selepas itu deposit tidak dikembalikan kecuali atas sebab kecemasan yang dipersetujui kedua-dua pihak.`,
    'Bayaran mengikut jadual di atas. Kelewatan bayaran melebihi 7 hari memberi hak kepada Pihak Pertama untuk menamatkan perjanjian.',
    'Sebarang kerosakan atau kehilangan harta akan ditolak daripada deposit keselamatan dan baki dituntut jika melebihi deposit.',
    ...s.rules.house,
    ...s.rules.policies,
    ...(a.terms ? a.terms.split('\n').filter((t) => t.trim()) : []),
  ]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...FOREST)
  if (y > 250) {
    doc.addPage()
    y = 20
  }
  doc.text('Terma dan syarat', 14, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  terms.forEach((t, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${t}`, w - 28)
    if (y + lines.length * 4.4 > 270) {
      doc.addPage()
      y = 20
    }
    doc.text(lines, 14, y)
    y += lines.length * 4.4 + 1.5
  })

  if (y > 230) {
    doc.addPage()
    y = 30
  } else y += 14
  const col = (w - 28) / 2
  ;[
    ['Pihak Pertama', s.bank.holder],
    ['Pihak Kedua', a.representative || a.party_name],
  ].forEach(([who, name], i) => {
    const x = 14 + i * (col + 8)
    doc.setDrawColor(...INK)
    doc.line(x, y + 18, x + col - 8, y + 18)
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(who, x, y)
    doc.setTextColor(...INK)
    doc.text(name, x, y + 23)
    doc.text('Tarikh:', x, y + 29)
    if (i === 1 && a.position) doc.text(a.position, x, y + 35)
  })
  footer(doc, s)
  return doc
}
