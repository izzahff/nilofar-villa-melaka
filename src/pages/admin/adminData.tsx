import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../../lib/api'
import type { BlockedDate, Booking, Payment } from '../../lib/types'

interface AdminData {
  bookings: Booking[]
  payments: Payment[]
  blocks: BlockedDate[]
  loading: boolean
  reload: () => Promise<void>
  paymentsFor: (bookingId: string) => Payment[]
}

const Ctx = createContext<AdminData | null>(null)

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [blocks, setBlocks] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const [b, p, k] = await Promise.all([api.listBookings(), api.listPayments(), api.listBlocks()])
      setBookings(b)
      setPayments(p)
      setBlocks(k)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const byBooking = useMemo(() => {
    const m = new Map<string, Payment[]>()
    for (const p of payments) m.set(p.booking_id, [...(m.get(p.booking_id) ?? []), p])
    return m
  }, [payments])

  const value = useMemo(
    () => ({ bookings, payments, blocks, loading, reload, paymentsFor: (id: string) => byBooking.get(id) ?? [] }),
    [bookings, payments, blocks, loading, reload, byBooking],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAdminData() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAdminData outside provider')
  return c
}
