'use client'
import { useEffect, useState } from 'react'
import type { ToolsText } from '@/lib/tools'

// «Карта шума дома»: шум каждой техники (по этикетке или вручную) → общий уровень, если всё работает одновременно:
// L = 10·lg(Σ 10^(Li/10)). Что заменить, чтобы стало тише — по самой тихой модели нашего каталога.
type Kind = 'fridges' | 'washing-machines' | 'tumble-dryers' | 'other'
type Item = { s: string; n: string; db: number }
type Row = { id: number; kind: Kind; model: Item | null; db: string }
const CATS: Kind[] = ['fridges', 'washing-machines', 'tumble-dryers']
const sum = (ls: number[]) => (ls.length ? 10 * Math.log10(ls.reduce((a, l) => a + 10 ** (l / 10), 0)) : 0)
const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : null }

export function NoiseMap({ t, lang }: { t: ToolsText; lang: string }) {
  const f = t.noise
  const [data, setData] = useState<Partial<Record<Kind, { items: Item[]; base: string | null }>>>({})
  useEffect(() => {
    let off = false
    CATS.forEach((c) => fetch(`/api/noise?lang=${lang}&cat=${c}`).then((r) => r.json())
      .then((j) => { if (!off) setData((d) => ({ ...d, [c]: { items: j.items ?? [], base: j.base ?? null } })) }).catch(() => {}))
    return () => { off = true }
  }, [lang])
  const [rows, setRows] = useState<Row[]>([{ id: 1, kind: 'fridges', model: null, db: '' }, { id: 2, kind: 'washing-machines', model: null, db: '' }])
  const [q, setQ] = useState<Record<number, string>>({})
  const kindName = (k: Kind) => f.kinds[CATS.indexOf(k)] ?? f.other

  // уровень строки: модель → вручную → медиана каталога
  const level = (r: Row): { v: number | null; how: 'model' | 'manual' | 'median' | null } => {
    if (r.model) return { v: r.model.db, how: 'model' }
    const n = Number(r.db.replace(',', '.'))
    if (r.db && Number.isFinite(n) && n > 0 && n < 140) return { v: n, how: 'manual' }
    if (r.kind !== 'other') { const m = median((data[r.kind]?.items ?? []).map((x) => x.db)); if (m) return { v: m, how: 'median' } }
    return { v: null, how: null }
  }
  const lv = rows.map((r) => ({ r, ...level(r) })).filter((x): x is typeof x & { v: number } => x.v != null)
  const total = sum(lv.map((x) => x.v))
  const loud = [...lv].sort((a, b) => b.v - a.v)[0]
  // лучшая замена: какая одна замена сильнее всего снижает общий уровень
  const tip = (() => {
    let best: { row: Row; to: Item; total: number } | null = null
    for (const x of lv) {
      if (x.r.kind === 'other') continue
      const items = data[x.r.kind]?.items ?? []
      const quiet = items.reduce<Item | null>((m, it) => (!m || it.db < m.db ? it : m), null)
      if (!quiet || quiet.db >= x.v) continue
      const nt = sum(lv.map((y) => (y === x ? quiet.db : y.v)))
      if (!best || nt < best.total) best = { row: x.r, to: quiet, total: nt }
    }
    return best
  })()
  const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 })
  const set = (id: number, p: Partial<Row>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...p } : r)))

  return (
    <div className="space-y-5">
      <ol className="space-y-3">
        {rows.map((r) => {
          const x = level(r)
          const items = r.kind === 'other' ? [] : data[r.kind]?.items ?? []
          const qq = (q[r.id] ?? '').trim().toLowerCase()
          const hits = qq.length >= 2 ? items.filter((i) => i.n.toLowerCase().includes(qq)).slice(0, 8) : []
          return (
            <li key={r.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[12rem_1fr_7rem_auto] sm:items-center">
              <select value={r.kind} onChange={(e) => set(r.id, { kind: e.target.value as Kind, model: null })} aria-label={f.device}
                className="h-11 rounded-lg border border-border bg-bg px-2">
                {[...CATS, 'other' as Kind].map((k) => <option key={k} value={k}>{kindName(k)}</option>)}
              </select>
              <div className="relative">
                {r.model ? (
                  <div className="flex h-11 items-center justify-between gap-2 rounded-lg border border-border px-3">
                    <span className="truncate">{r.model.n}</span>
                    <button type="button" onClick={() => set(r.id, { model: null })} className="text-muted" aria-label="×">✕</button>
                  </div>
                ) : r.kind === 'other' ? <span className="text-sm text-muted">{f.otherHint}</span> : (
                  <input value={q[r.id] ?? ''} onChange={(e) => setQ({ ...q, [r.id]: e.target.value })} placeholder={f.search}
                    className="h-11 w-full rounded-lg border border-border bg-bg px-3" />
                )}
                {!r.model && hits.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-bg shadow-lg">
                    {hits.map((i) => <li key={i.s}><button type="button" onClick={() => { set(r.id, { model: i }); setQ({ ...q, [r.id]: '' }) }}
                      className="flex w-full justify-between gap-2 px-3 py-2 text-start hover:bg-surface"><span className="truncate">{i.n}</span><span className="num text-muted">{i.db} dB</span></button></li>)}
                  </ul>
                )}
              </div>
              <label className="flex h-11 items-center rounded-lg border border-border px-2">
                <input inputMode="decimal" value={r.model ? String(r.model.db) : r.db} disabled={!!r.model} onChange={(e) => set(r.id, { db: e.target.value })}
                  placeholder={x.how === 'median' ? nf.format(x.v!) : '—'} className="num w-full bg-transparent outline-none" aria-label="dB" />
                <span className="text-sm text-muted">dB</span>
              </label>
              <button type="button" onClick={() => setRows(rows.filter((y) => y.id !== r.id))} className="h-11 justify-self-end rounded-lg px-3 text-muted hover:text-fg" aria-label={f.remove}>✕</button>
              {x.how === 'median' && <p className="text-xs text-muted sm:col-span-4">{f.median.replace('{n}', String(items.length))}</p>}
            </li>
          )
        })}
      </ol>
      <button type="button" onClick={() => setRows([...rows, { id: Math.max(0, ...rows.map((r) => r.id)) + 1, kind: 'tumble-dryers', model: null, db: '' }])}
        className="min-h-11 rounded-xl border border-border px-4 font-medium hover:border-accent">+ {f.add}</button>

      {lv.length > 0 && (
        <div className="rounded-2xl bg-surface p-4" aria-live="polite">
          <p className="text-lg">{f.total} <b className="num text-2xl">{nf.format(total)} dB</b></p>
          <ul className="mt-3 space-y-1.5">{[...lv].sort((a, b) => b.v - a.v).map((x) => {
            const share = (10 ** (x.v / 10)) / lv.reduce((a, y) => a + 10 ** (y.v / 10), 0)
            return (
              <li key={x.r.id} className="text-sm">
                <div className="flex justify-between gap-2"><span>{x.r.model?.n ?? kindName(x.r.kind)}</span><span className="num text-muted">{nf.format(x.v)} dB · {Math.round(share * 100)}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-border"><div className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(2, share * 100)}%` }} /></div>
              </li>
            )
          })}</ul>
          {loud && lv.length > 1 && <p className="mt-3 text-sm">{f.loudest.replace('{name}', loud.r.model?.n ?? kindName(loud.r.kind))}</p>}
          {tip && tip.total < total - 0.4 && (
            <p className="mt-2 text-sm">💡 {f.tip.replace('{what}', tip.row.model?.n ?? kindName(tip.row.kind)).replace('{db}', nf.format(total - tip.total))}{' '}
              <a href={data[tip.row.kind]?.base ? `${data[tip.row.kind]!.base}/${tip.to.s}` : undefined} className="font-medium text-accent hover:underline">{tip.to.n} ({tip.to.db} dB)</a></p>
          )}
        </div>
      )}
      <p className="text-xs text-muted">{f.note}</p>
    </div>
  )
}
