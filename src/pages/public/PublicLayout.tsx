import { CalendarDays, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from '../../components/BrandIcons'
import { Logo } from '../../components/Logo'
import { cx } from '../../components/ui'
import { isDemo } from '../../lib/api'
import { useScrolled } from '../../lib/hooks'
import { SettingsProvider, useSettings } from '../../lib/settings'
import { waLink } from '../../lib/whatsapp'

const NAV = [
  { href: '/#villa', label: 'Villa' },
  { href: '/#bilik', label: 'Bilik' },
  { href: '/#galeri', label: 'Galeri' },
  { href: '/#lokasi', label: 'Lokasi' },
  { href: '/#harga', label: 'Harga' },
  { href: '/tour', label: 'Tour maya' },
]

export function PublicLayout() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  )
}

function Shell() {
  const { pathname, hash } = useLocation()
  const isHome = pathname === '/'
  const scrolled = useScrolled(60)
  const solid = !isHome || scrolled
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
    if (hash) {
      const el = document.querySelector(hash)
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60)
    } else window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="flex min-h-dvh flex-col">
      {isDemo && (
        <div className="bg-gold/90 px-4 py-1.5 text-center text-[12px] font-medium text-forest-dark">
          Mod demo. Data disimpan dalam pelayar ini sahaja. <Link to="/admin" className="underline">Cuba admin</Link>
        </div>
      )}
      <header
        className={cx(
          'sticky top-0 z-50 transition-all duration-500',
          solid ? 'bg-ivory/85 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-xl' : 'bg-transparent',
          isHome && !scrolled && '-mb-[72px]',
        )}
      >
        <div className="container-x flex h-[72px] items-center justify-between">
          <Link to="/" aria-label="Nilofar Villa Melaka">
            <Logo light={!solid} />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.href}
                to={n.href}
                className={cx('rounded-full px-3.5 py-2 text-[13.5px] font-medium transition', solid ? 'text-ink/80 hover:bg-sand hover:text-forest' : 'text-white/85 hover:bg-white/10 hover:text-white')}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/tempah"
              className={cx('hidden h-10 items-center gap-2 rounded-full px-5 text-[13.5px] font-semibold transition sm:inline-flex', solid ? 'bg-forest text-white hover:bg-forest-light' : 'bubble text-white')}
            >
              <CalendarDays className="size-4" /> Semak tarikh
            </Link>
            <button onClick={() => setOpen(true)} className={cx('grid size-10 place-items-center rounded-full lg:hidden', solid ? 'text-forest hover:bg-sand' : 'text-white hover:bg-white/10')} aria-label="Menu">
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>{open && <MobileMenu onClose={() => setOpen(false)} />}</AnimatePresence>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      {pathname !== '/tempah' && !pathname.startsWith('/borang') && <MobileCta />}
    </div>
  )
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-forest-dark/60 backdrop-blur-sm" onClick={onClose} />
      <motion.nav
        className="absolute inset-y-0 right-0 flex w-[82%] max-w-sm flex-col bg-ivory p-6"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
      >
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <button onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Tutup menu">
            <X className="size-5" />
          </button>
        </div>
        {NAV.map((n, i) => (
          <motion.div key={n.href} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i + 0.1 }}>
            <Link to={n.href} onClick={onClose} className="block border-b border-sand py-4 font-display text-3xl font-semibold text-forest">
              {n.label}
            </Link>
          </motion.div>
        ))}
        <Link to="/tempah" onClick={onClose} className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-full bg-forest font-semibold text-white">
          <CalendarDays className="size-4" /> Semak tarikh kosong
        </Link>
      </motion.nav>
    </motion.div>
  )
}

function MobileCta() {
  const { settings } = useSettings()
  const scrolled = useScrolled(500)
  const wa = settings.contacts.whatsapp[0]
  return (
    <AnimatePresence>
      {scrolled && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-ivory/90 px-4 pt-3 pb-safe backdrop-blur-xl md:hidden"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          <div className="flex gap-2">
            <Link to="/tempah" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-forest text-[15px] font-semibold text-white shadow-lg">
              <CalendarDays className="size-4" /> Semak kekosongan
            </Link>
            {wa && (
              <a href={waLink(wa.phone, 'Assalamualaikum, saya berminat dengan Nilofar Villa Melaka.')} target="_blank" rel="noreferrer" className="grid size-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg" aria-label="WhatsApp">
                <WhatsAppIcon className="size-6" />
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Footer() {
  const { settings } = useSettings()
  const c = settings.contacts
  return (
    <footer className="bg-forest-dark pb-28 text-white/80 md:pb-0">
      <div className="container-x grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">{settings.site.location}</p>
          <div className="mt-6 flex gap-2">
            {[
              { href: c.facebook, icon: FacebookIcon, label: 'Facebook' },
              { href: c.instagram, icon: InstagramIcon, label: 'Instagram' },
              { href: c.tiktok, icon: TikTokIcon, label: 'TikTok' },
            ]
              .filter((s) => s.href)
              .map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="grid size-10 place-items-center rounded-full bg-white/8 text-white transition hover:bg-gold hover:text-forest-dark">
                  <s.icon className="size-[18px]" />
                </a>
              ))}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-4 text-gold">Tempahan</p>
          <ul className="space-y-3 text-sm">
            {c.whatsapp.map((w) => (
              <li key={w.phone}>
                <a href={waLink(w.phone, 'Assalamualaikum, saya ingin bertanya tentang Nilofar Villa Melaka.')} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold">
                  <WhatsAppIcon className="size-4 text-[#25D366]" /> {w.name}, +{w.phone}
                </a>
              </li>
            ))}
            {c.google_maps && (
              <li>
                <a href={c.google_maps} target="_blank" rel="noreferrer" className="hover:text-gold">
                  Buka di Google Maps
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-gold">Masa</p>
          <ul className="space-y-2 text-sm">
            <li>Check in, {settings.site.checkin_time}</li>
            <li>Check out, {settings.site.checkout_time}</li>
            <li>Ideal {settings.site.capacity_ideal} orang, maksimum {settings.site.capacity_max}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Nilofar Villa Melaka. Tempahan disahkan melalui WhatsApp.</span>
          <Link to="/admin" className="hover:text-white/70">
            Log masuk admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
