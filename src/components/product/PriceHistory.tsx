import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { PricePoint } from '@/lib/types'
import { money } from '@/lib/format'

/** История цены: линия за 90 дней + минимум/максимум/сейчас. Только реальные данные (Omnibus). Без JS. */
export function PriceHistory({ lang, t, points, currency }: { lang: Locale; t: Dict; points: PricePoint[]; currency: string }) {
  if (points.length < 2) return null
  const W = 600, H = 140, P = 8
  const prices = points.map((p) => p.price)
  const min = Math.min(...prices), max = Math.max(...prices), span = max - min || 1
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P)
  const y = (v: number) => P + (1 - (v - min) / span) * (H - 2 * P)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(' ')
  const area = `${d} L${x(points.length - 1)},${H} L${x(0)},${H} Z`
  const now = prices[prices.length - 1]
  const stat = (label: string, v: number, cls = '') => (
    <div><div className="text-xs text-muted">{label}</div><div className={`num font-semibold ${cls}`}>{money(lang, v, currency)}</div></div>
  )
  return (
    <section aria-labelledby="ph" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id="ph" className="text-xl font-semibold">{t.ui.priceHistory}</h2>
        <span className="text-xs text-muted">{t.ui.days90}</span>
      </div>
      <div className="rounded-2xl border border-border p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full" role="img" aria-label={`${t.ui.lowest} ${money(lang, min, currency)}, ${t.ui.highest} ${money(lang, max, currency)}, ${t.ui.current} ${money(lang, now, currency)}`} preserveAspectRatio="none">
          <path d={area} fill="var(--accent-soft)" />
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <circle cx={x(points.length - 1)} cy={y(now)} r="4" fill="var(--accent)" />
        </svg>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {stat(t.ui.lowest, min, 'text-good')}{stat(t.ui.highest, max)}{stat(t.ui.current, now, 'text-accent')}
        </div>
      </div>
    </section>
  )
}
