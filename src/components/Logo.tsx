import { cx } from './ui'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <path d="M20 8c3.6 4.2 6 7.2 6 11.2a6 6 0 0 1-12 0C14 15.2 16.4 12.2 20 8z" fill="#C9A66B" />
      <path d="M20 19.5c-4.3 0-7.8 2.7-9.2 7 3.4.8 6.4-.6 9.2-3.4 2.8 2.8 5.8 4.2 9.2 3.4-1.4-4.3-4.9-7-9.2-7z" fill="#B76E79" />
      <path d="M20 26.5V33" stroke="#C9A66B" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cx('flex items-center gap-2.5', light ? 'text-white' : 'text-forest', className)}>
      <LogoMark className="size-9" />
      <span className="leading-none">
        <span className="block font-display text-[22px] font-semibold tracking-tight">Nilofar Villa</span>
        <span className={cx('block text-[9.5px] font-semibold uppercase tracking-[0.34em]', light ? 'text-gold' : 'text-gold-dark')}>Melaka</span>
      </span>
    </span>
  )
}
