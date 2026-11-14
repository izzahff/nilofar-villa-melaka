import {
  BarChart3,
  CalendarDays,
  Compass,
  ExternalLink,
  History,
  Images,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { PageLoader, cx } from '../../components/ui'
import { api, isDemo, type SessionUser } from '../../lib/api'
import { SettingsProvider } from '../../lib/settings'
import { AdminDataProvider } from './adminData'
import Login from './Login'

const Dashboard = lazy(() => import('./Dashboard'))
const CalendarPage = lazy(() => import('./CalendarPage'))
const Bookings = lazy(() => import('./Bookings'))
const BookingDetail = lazy(() => import('./BookingDetail'))
const MediaPage = lazy(() => import('./MediaPage'))
const TourAdmin = lazy(() => import('./TourAdmin'))
const Reports = lazy(() => import('./Reports'))
const SettingsPage = lazy(() => import('./SettingsPage'))
const AuditPage = lazy(() => import('./AuditPage'))

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/kalendar', label: 'Kalendar', icon: CalendarDays },
  { to: '/admin/tempahan', label: 'Tempahan', icon: ListChecks },
  { to: '/admin/laporan', label: 'Laporan', icon: BarChart3 },
  { to: '/admin/media', label: 'Galeri', icon: Images },
  { to: '/admin/tour', label: 'Tour maya', icon: Compass },
  { to: '/admin/tetapan', label: 'Tetapan', icon: Settings },
  { to: '/admin/log', label: 'Log aktiviti', icon: History },
]

export default function AdminApp() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined)
  const [admin, setAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    api.getUser().then(setUser)
    return api.onAuthChange(setUser)
  }, [])

  useEffect(() => {
    if (user) api.isAdmin().then(setAdmin)
    else setAdmin(null)
  }, [user])

  useEffect(() => {
    document.title = 'Admin | Nilofar Villa Melaka'
  }, [])

  if (user === undefined || (user && admin === null)) return <PageLoader />
  if (!user) return <Login />
  if (!admin)
    return (
      <div className="grid min-h-dvh place-items-center bg-ivory p-6 text-center">
        <div>
          <p className="font-display text-3xl font-semibold text-forest">Akaun ini bukan admin</p>
          <p className="mt-2 text-muted">{user.email} belum didaftarkan dalam jadual admins.</p>
          <button onClick={() => api.signOut()} className="mt-5 rounded-full bg-forest px-5 py-2.5 text-white">
            Log keluar
          </button>
        </div>
      </div>
    )

  return (
    <SettingsProvider full>
      <AdminDataProvider>
        <Shell user={user} />
      </AdminDataProvider>
    </SettingsProvider>
  )
}

function Shell({ user }: { user: SessionUser }) {
  const [menu, setMenu] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setMenu(false), [pathname])

  const side = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) =>
            cx('relative flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition', isActive ? 'text-forest-dark' : 'text-white/70 hover:bg-white/5 hover:text-white')
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-gold" transition={{ type: 'spring', damping: 30, stiffness: 350 }} />}
              <n.icon className="relative size-[18px]" />
              <span className="relative">{n.label}</span>
            </>
          )}
        </NavLink>
      ))}
      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <Link to="/" target="_blank" className="flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] text-white/60 hover:text-white">
          <ExternalLink className="size-4" /> Lihat laman web
        </Link>
        <button onClick={() => api.signOut()} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] text-white/60 hover:text-white">
          <LogOut className="size-4" /> Log keluar
        </button>
        <p className="truncate px-3 pt-2 text-[11px] text-white/35">{user.email}</p>
      </div>
    </nav>
  )

  return (
    <div className="min-h-dvh bg-[#f6f3ee] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-forest-dark p-4 lg:flex">
        <Link to="/admin" className="mb-8 px-2 pt-2">
          <Logo light />
        </Link>
        {side}
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/5 bg-[#f6f3ee]/90 px-4 backdrop-blur-xl lg:hidden">
        <Link to="/admin">
          <Logo />
        </Link>
        <button onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Menu">
          <Menu className="size-5" />
        </button>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
            <motion.aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-forest-dark p-4" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="mb-6 flex items-center justify-between px-2 pt-2">
                <Logo light />
                <button onClick={() => setMenu(false)} className="text-white/70" aria-label="Tutup">
                  <X className="size-5" />
                </button>
              </div>
              {side}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {isDemo && <div className="bg-gold/90 px-4 py-1.5 text-center text-[12px] font-medium text-forest-dark">Mod demo. Semua perubahan disimpan dalam pelayar ini sahaja.</div>}

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="kalendar" element={<CalendarPage />} />
            <Route path="tempahan" element={<Bookings />} />
            <Route path="tempahan/:id" element={<BookingDetail />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="tour" element={<TourAdmin />} />
            <Route path="laporan" element={<Reports />} />
            <Route path="tetapan" element={<SettingsPage />} />
            <Route path="log" element={<AuditPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Bottom nav for phones */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-black/5 bg-white/95 pb-safe backdrop-blur-xl lg:hidden">
        {NAV.slice(0, 4).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('flex flex-col items-center gap-0.5 pt-2.5 text-[11px] font-medium', isActive ? 'text-forest' : 'text-muted')}>
            {({ isActive }) => (
              <>
                <span className={cx('grid h-7 w-12 place-items-center rounded-full transition', isActive && 'bg-gold/30')}>
                  <n.icon className="size-[19px]" />
                </span>
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-4xl font-semibold text-forest">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
