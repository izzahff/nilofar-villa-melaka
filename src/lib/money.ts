import type { Booking, Payment } from './types'

export interface MoneySummary {
  rentPaid: number
  rentBalance: number
  depositReceived: number
  depositRefunded: number
  depositDeducted: number
  depositHeld: number
  lateFees: number
  collected: number // money kept by the homestay (rent + late fees + deductions)
}

export function summarize(b: Pick<Booking, 'total_price'>, payments: Payment[]): MoneySummary {
  const sum = (t: Payment['type']) => payments.filter((p) => p.type === t).reduce((a, p) => a + Number(p.amount), 0)
  const rentPaid = sum('rental')
  const depositReceived = sum('deposit')
  const depositRefunded = sum('deposit_refund')
  const depositDeducted = sum('deposit_deduction')
  const lateFees = sum('late_checkout')
  return {
    rentPaid,
    rentBalance: Math.max(0, Number(b.total_price) - rentPaid),
    depositReceived,
    depositRefunded,
    depositDeducted,
    depositHeld: Math.max(0, depositReceived - depositRefunded - depositDeducted),
    lateFees,
    collected: rentPaid + lateFees + depositDeducted,
  }
}
