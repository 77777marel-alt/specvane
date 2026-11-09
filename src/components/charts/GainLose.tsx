import { IconCheck, IconMinus } from '../icons'

type Row = { key: string; label: string; higherIsBetter?: boolean | null; values: { display: string; value: number | boolean | string | null }[] }

/**
 * «Что получите и что потеряете при переходе с A на B» — из цифр таблицы сравнения (без ИИ):
 * числа с известным направлением (+38% батареи, −12% веса) и функции да/нет (появится / пропадёт).
 */
export function GainLose({ rows, from, to, s }: { rows: Row[]; from: string; to: string; s: { gainTitle: string; gain: string; lose: string; noChange: string } }) {
  const gain: { t: string; w: number }[] = [], lose: { t: string; w: number }[] = []
  for (const r of rows) {
    if (r.higherIsBetter == null || r.values.length !== 2) continue
    const [a, b] = r.values
    if (typeof a.value === 'number' && typeof b.value === 'number' && a.value > 0 && b.value > 0 && a.display !== b.display) {
      const pct = Math.round(((b.value - a.value) / a.value) * 100)
      if (Math.abs(pct) < 3) continue
      const better = r.higherIsBetter ? b.value > a.value : b.value < a.value
      const txt = `${r.label}: ${b.display} (${pct > 0 ? '+' : '−'}${Math.abs(pct)}%)`
      ;(better ? gain : lose).push({ t: txt, w: Math.abs(pct) })
    } else if (typeof a.value === 'boolean' && typeof b.value === 'boolean' && a.value !== b.value) {
      const better = r.higherIsBetter ? b.value : a.value
      ;(better ? gain : lose).push({ t: r.label, w: 50 })
    }
  }
  if (!gain.length && !lose.length) return null
  const list = (items: { t: string; w: number }[], good: boolean) => (
    <ul className="space-y-1.5 text-sm">
      {items.sort((x, y) => y.w - x.w).slice(0, 8).map((x) => (
        <li key={x.t} className="flex items-start gap-2">
          {good ? <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-good" /> : <IconMinus className="mt-0.5 h-4 w-4 shrink-0 text-bad" />}
          <span className="num">{x.t}</span>
        </li>
      ))}
      {!items.length && <li className="text-muted">{s.noChange}</li>}
    </ul>
  )
  return (
    <section aria-labelledby="switch" className="rounded-2xl border border-border p-4">
      <h2 id="switch" className="text-xl font-semibold">{s.gainTitle.replace('{a}', from).replace('{b}', to)}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div><h3 className="mb-2 font-semibold text-good">{s.gain}</h3>{list(gain, true)}</div>
        <div><h3 className="mb-2 font-semibold text-bad">{s.lose}</h3>{list(lose, false)}</div>
      </div>
    </section>
  )
}
