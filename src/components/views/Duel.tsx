'use client'
import { useMemo, useState } from 'react'

// «Дуэль за 30 секунд»: посетитель отмечает, что ему важно, — победитель по взвешенным местам в каталоге
// (better = доля моделей категории, которые модель обходит по характеристике). Без цен и без генеративного текста.
export type DuelText = { title: string; lead: string; levels: string[]; result: string; tie: string; wins: string; basis: string; none: string; specs: string }
export type DuelGroup = { name: string; a: number; b: number; specs: string[] }

export function Duel({ t, names, groups }: { t: DuelText; names: [string, string]; groups: DuelGroup[] }) {
  const [w, setW] = useState<number[]>(() => groups.map(() => 1))
  const r = useMemo(() => {
    const tot = w.reduce((s, x) => s + x, 0)
    if (!tot) return null
    const sa = groups.reduce((s, g, i) => s + g.a * w[i], 0) / tot, sb = groups.reduce((s, g, i) => s + g.b * w[i], 0) / tot
    const care = groups.filter((_, i) => w[i] > 0)
    const winA = sa >= sb
    const ahead = care.filter((g) => (winA ? g.a > g.b : g.b > g.a)).length
    return { sa: Math.round(sa), sb: Math.round(sb), tie: Math.abs(sa - sb) < 3, winA, ahead, m: care.length }
  }, [w, groups])
  const C = ['#2f5bea', '#e0457b']
  return (
    <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border p-5" aria-labelledby="duel-h">
      <h2 id="duel-h" className="text-xl font-bold">⚔️ {t.title}</h2>
      <p className="mt-1 text-sm text-muted">{t.lead}</p>
      <ol className="mt-4 space-y-4">
        {groups.map((g, i) => (
          <li key={g.name}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{g.name}</span>
              <span className="inline-flex overflow-hidden rounded-xl border border-border text-sm" role="group" aria-label={g.name}>
                {t.levels.map((lv, k) => (
                  <button key={k} type="button" aria-pressed={w[i] === k} onClick={() => setW(w.map((x, j) => (j === i ? k : x)))}
                    className={`min-h-10 px-3 ${w[i] === k ? 'bg-accent font-semibold text-white' : 'hover:bg-surface'}`}>{lv}</button>
                ))}
              </span>
            </div>
            <div className="mt-2 grid gap-1" aria-hidden="true">
              {[g.a, g.b].map((v, k) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="h-2 rounded-full" style={{ width: `${Math.max(2, v)}%`, background: C[k], opacity: w[i] ? 1 : 0.35 }} />
                  <span className="num text-muted">{v}</span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">{t.specs.replace('{list}', g.specs.join(', '))}</p>
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-xl bg-surface p-4" aria-live="polite">
        {!r ? <p>{t.none}</p> : r.tie ? <p className="text-lg font-semibold">{t.tie}</p> : (
          <>
            <p className="text-lg font-semibold" style={{ color: C[r.winA ? 0 : 1] }}>🏆 {t.result.replace('{name}', names[r.winA ? 0 : 1])}</p>
            <p className="mt-1 text-sm">{t.wins.replace('{n}', String(r.ahead)).replace('{m}', String(r.m))}</p>
          </>
        )}
        {r && <p className="num mt-2 text-sm"><span style={{ color: C[0] }}>■</span> {names[0]}: {r.sa} · <span style={{ color: C[1] }}>■</span> {names[1]}: {r.sb}</p>}
      </div>
      <p className="mt-3 text-xs text-muted">{t.basis}</p>
    </section>
  )
}
