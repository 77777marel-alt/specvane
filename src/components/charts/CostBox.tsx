'use client'
import { useState } from 'react'
import type { CostInput } from '@/lib/costs'

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '')

/**
 * Калькулятор расходов на электричество: посетитель вводит свою цену за кВт·ч и как пользуется (часы в день / циклы в год).
 * По умолчанию — средняя цена в стране языка и типичное использование; результат пересчитывается сразу.
 */
export function CostBox({ c, s }: { c: CostInput; s: Record<string, string> }) {
  const [tariff, setTariff] = useState(String(c.tariff))
  const [hours, setHours] = useState(String(c.hours ?? ''))
  const [cycles, setCycles] = useState(String(c.cycles ?? ''))
  const num = (v: string) => { const x = Number(v.replace(',', '.')); return Number.isFinite(x) && x >= 0 ? x : 0 }
  const kwh = c.mode === 'annual' ? c.annual! : c.mode === 'cycle' ? c.perCycle! * num(cycles) : (c.watts! * num(hours) * (c.days ?? 365)) / 1000
  const money = (v: number) => new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.currency, maximumFractionDigits: v >= 100 ? 0 : 2 }).format(v)
  const year = kwh * num(tariff)
  const field = 'h-10 w-28 rounded-xl border border-border bg-bg px-3 text-sm num'
  return (
    <section aria-labelledby="cost" className="rounded-2xl border border-border p-4">
      <h2 id="cost" className="text-xl font-semibold">{s.costTitle}</h2>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span className="num text-2xl font-bold">{fill(s.costYear, { cost: money(year) })}</span>
        <span className="num text-muted">{fill(s.cost5, { cost: money(year * 5) })}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-muted">{s.costTariff} ({c.currency})</span>
          <input inputMode="decimal" value={tariff} onChange={(e) => setTariff(e.target.value)} className={field} />
        </label>
        {c.mode === 'power' && (
          <label className="flex flex-col gap-1">
            <span className="text-muted">{s.costHours}</span>
            <input inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} className={field} />
          </label>
        )}
        {c.mode === 'cycle' && (
          <label className="flex flex-col gap-1">
            <span className="text-muted">{s.costCycles}</span>
            <input inputMode="numeric" value={cycles} onChange={(e) => setCycles(e.target.value)} className={field} />
          </label>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">
        {fill(s.costNote, { kwh: new Intl.NumberFormat(c.locale, { maximumFractionDigits: 0 }).format(kwh), tariff: money(c.tariff), country: c.country })} {s[c.basis]}
      </p>
    </section>
  )
}
