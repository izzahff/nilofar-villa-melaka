import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'
import { DEFAULT_SETTINGS } from './defaults'
import type { AllSettings, Holiday } from './types'

interface Ctx {
  settings: AllSettings
  holidays: Holiday[]
  holidaySet: Set<string>
  loading: boolean
  reload: () => Promise<void>
}

const SettingsCtx = createContext<Ctx | null>(null)

function merge(partial: Partial<AllSettings>): AllSettings {
  const out = structuredClone(DEFAULT_SETTINGS)
  for (const k of Object.keys(partial) as (keyof AllSettings)[]) {
    const v = partial[k]
    if (v && typeof v === 'object') out[k] = { ...out[k], ...v } as never
  }
  return out
}

/**
 * Loads public settings for the site. In the admin, `full` also loads bank
 * details and message templates.
 */
export function SettingsProvider({ children, full = false }: { children: ReactNode; full?: boolean }) {
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([full ? api.getAllSettings() : api.getPublicSettings(), api.getHolidays()])
      setSettings(merge(s))
      setHolidays(h)
    } catch (e) {
      console.warn('settings load failed, using defaults', e)
    } finally {
      setLoading(false)
    }
  }, [full])

  useEffect(() => {
    reload()
  }, [reload])

  const holidaySet = useMemo(() => new Set(holidays.map((h) => h.date)), [holidays])
  const value = useMemo(() => ({ settings, holidays, holidaySet, loading, reload }), [settings, holidays, holidaySet, loading, reload])
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>
}

export function useSettings() {
  const c = useContext(SettingsCtx)
  if (!c) throw new Error('useSettings outside provider')
  return c
}
