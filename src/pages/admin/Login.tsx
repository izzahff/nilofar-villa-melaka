import { Lock } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { Button, Field, Input } from '../../components/ui'
import { api, friendlyError, isDemo } from '../../lib/api'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../../lib/api/demoApi'
import { IMG } from '../../lib/demoMedia'

export default function Login() {
  const [email, setEmail] = useState(isDemo ? DEMO_EMAIL : '')
  const [password, setPassword] = useState(isDemo ? DEMO_PASSWORD : '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.signIn(email, password)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={IMG.night} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/40 to-transparent" />
        <div className="absolute bottom-10 left-10 text-white">
          <Logo light />
          <p className="mt-4 max-w-sm text-white/70">Urus tempahan, bayaran, resit dan kalendar Nilofar Villa Melaka di satu tempat.</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-ivory p-6">
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-forest text-gold">
            <Lock className="size-5" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-forest">Log masuk admin</h1>
          <p className="mt-1 mb-8 text-sm text-muted">Untuk tuan rumah Nilofar Villa Melaka sahaja.</p>
          <div className="space-y-4">
            <Field label="Emel">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
            </Field>
            <Field label="Kata laluan">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Log masuk
            </Button>
          </div>
          {isDemo && (
            <p className="mt-5 rounded-xl bg-gold/15 p-3 text-xs text-forest">
              Mod demo. Emel <b>{DEMO_EMAIL}</b>, kata laluan <b>{DEMO_PASSWORD}</b>.
            </p>
          )}
          <Link to="/" className="mt-8 block text-center text-sm text-muted hover:text-forest">
            Kembali ke laman web
          </Link>
        </motion.form>
      </div>
    </div>
  )
}
