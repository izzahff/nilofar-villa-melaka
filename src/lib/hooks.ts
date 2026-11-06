import { addMonths } from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api'
import { busyNightSet, iso } from './pricing'
import type { BusyRange } from './types'

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async () => {
    setLoading(true)
    try {
      const v = await fnRef.current()
      setData(v)
      setError(null)
      return v
    } catch (e) {
      setError(e)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, error, loading, reload: run, setData }
}

/** Busy nights for the next 18 months, for the public calendar. */
export function useBusyNights() {
  const { data, loading, reload } = useAsync<BusyRange[]>(() => api.getBusyRanges(iso(new Date()), iso(addMonths(new Date(), 18))))
  const busy = useMemo(() => busyNightSet(data ?? []), [data])
  return { busy, loading, reload }
}

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [q])
  return m
}

export function useScrolled(px = 40) {
  const [s, setS] = useState(false)
  useEffect(() => {
    const on = () => setS(window.scrollY > px)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [px])
  return s
}
