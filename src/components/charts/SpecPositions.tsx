import type { SpecPosition } from '@/lib/catalog'
import { fill } from '@/lib/format'

/**
 * «Где модель среди всех моделей категории»: по каждой числовой характеристике — гистограмма
 * значений категории (слева хуже, справа лучше), отметка модели и «лучше, чем у N%». Чистый SVG, без JS.
 */
export function SpecPositions({ items, title, betterThan }: { items: SpecPosition[]; title: string; betterThan: string }) {
  if (items.length < 2) return null
  return (
    <section aria-labelledby="pos" className="space-y-3">
      <h2 id="pos" className="text-xl font-semibold">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((p) => {
          const max = Math.max(...p.hist, 1)
          const tone = p.better >= 75 ? 'text-good' : p.better >= 40 ? 'text-accent' : 'text-muted'
          return (
            <li key={p.key} className="rounded-2xl border border-border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-muted">{p.label}</span>
                <span className="num font-semibold">{p.display}</span>
              </div>
              <svg viewBox="0 0 200 40" className="mt-2 h-10 w-full" role="img" aria-label={`${p.label}: ${fill(betterThan, { p: p.better })}`} preserveAspectRatio="none">
                {p.hist.map((c, i) => {
                  const h = (c / max) * 34
                  const on = Math.min(19, Math.floor(p.at * 20)) === i
                  return <rect key={i} x={i * 10 + 1} y={36 - h} width={8} height={Math.max(h, 1)} rx={1.5}
                    className={on ? 'fill-accent' : 'fill-surface-2'} />
                })}
                <line x1={p.at * 200} x2={p.at * 200} y1={0} y2={40} className="stroke-accent" strokeWidth={1.5} strokeDasharray="2 2" />
              </svg>
              <p className={`mt-1 text-xs font-medium ${tone}`}>{fill(betterThan, { p: p.better })}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
