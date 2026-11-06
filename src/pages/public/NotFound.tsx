import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <p className="font-display text-8xl font-semibold text-gold">404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-forest">Halaman tidak dijumpai</h1>
      <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-forest px-6 text-white">
        Ke laman utama
      </Link>
    </div>
  )
}
