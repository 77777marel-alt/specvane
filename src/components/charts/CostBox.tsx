import type { RunningCost } from '@/lib/costs'
import { fill } from '@/lib/format'

/** Сколько стоит электричество для этой модели в год и за 5 лет (оценка по паспорту и тарифу страны). */
export function CostBox({ c, s }: { c: RunningCost; s: Record<string, string> }) {
  return (
    <section aria-labelledby="cost" className="rounded-2xl border border-border p-4">
      <h2 id="cost" className="text-xl font-semibold">{s.costTitle}</h2>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span className="num text-2xl font-bold">{fill(s.costYear, { cost: c.year })}</span>
        <span className="num text-muted">{fill(s.cost5, { cost: c.five })}</span>
      </div>
      <p className="mt-2 text-xs text-muted">{fill(s.costNote, { kwh: c.kwh, tariff: c.tariff, country: c.country })} {s[c.basis]}</p>
    </section>
  )
}
