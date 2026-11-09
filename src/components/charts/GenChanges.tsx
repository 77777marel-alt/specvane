import type { SpecValue } from '@/lib/types'

/** «Что изменилось по сравнению с прошлым поколением»: только отличающиеся характеристики, зелёным — что стало лучше. */
export function GenChanges({ prev, prevName, prevHref, cur, title }: { prev: SpecValue[]; prevName: string; prevHref: string; cur: SpecValue[]; title: string }) {
  const rows = cur.flatMap((c) => {
    const p = prev.find((x) => x.key === c.key)
    if (!p || p.display === c.display) return []
    let tone = ''
    if (c.higherIsBetter != null && typeof c.value === 'number' && typeof p.value === 'number')
      tone = (c.higherIsBetter ? c.value > p.value : c.value < p.value) ? 'text-good' : 'text-bad'
    if (c.higherIsBetter != null && typeof c.value === 'boolean' && typeof p.value === 'boolean')
      tone = (c.higherIsBetter ? c.value : !c.value) ? 'text-good' : 'text-bad'
    return [{ key: c.key, label: c.label, from: p.display, to: c.display, tone, rank: tone ? 0 : 1 }]
  }).sort((a, b) => a.rank - b.rank).slice(0, 14)
  if (rows.length < 2) return null
  return (
    <section aria-labelledby="gen" className="space-y-3">
      <h2 id="gen" className="text-xl font-semibold">{title.split('{name}')[0]}<a href={prevHref} className="text-accent hover:underline">{prevName}</a>{title.split('{name}')[1] ?? ''}</h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row" className="w-2/5 px-4 py-2.5 text-start font-normal text-muted">{r.label}</th>
                <td className="num px-4 py-2.5 text-muted line-through decoration-muted/50">{r.from}</td>
                <td className={`num px-4 py-2.5 font-medium ${r.tone}`}>→ {r.to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
