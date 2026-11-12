'use client'
import { useEffect, useMemo, useState } from 'react'
import type { ToolsText } from '@/lib/tools'

// «Поместится ли?»: размеры ниши / стены / стола → все модели каталога, которые туда входят (ширина и высота
// без подставки по данным производителя, ≈ — оценка по диагонали). Самые большие экраны — первыми.
type Item = { s: string; n: string; img: string | null; w: number; h: number; d: number | null; dg: number | null; ap: boolean }
type Cat = 'tvs' | 'monitors'
const IN = 2.54
const PAGE = 24

export function FitFinder({ t, lang, imperialDefault = false }: { t: ToolsText; lang: string; imperialDefault?: boolean }) {
  const f = t.fit
  const [cat, setCat] = useState<Cat>('tvs')
  const [imp, setImp] = useState(imperialDefault)
  const [W, setW] = useState(imperialDefault ? '59' : '150')
  const [H, setH] = useState(imperialDefault ? '35.4' : '90')
  const [D, setD] = useState('')
  const [gap, setGap] = useState(imperialDefault ? '0.8' : '2')
  const [items, setItems] = useState<Item[] | null>(null)
  const [base, setBase] = useState<string | null>(null)
  const [pick, setPick] = useState<number | null>(null)
  const [shown, setShown] = useState(PAGE)

  // ?cat=&w=&h=&d= — ссылкой можно поделиться (в сантиметрах)
  useEffect(() => {
    // параметры из адреса читаем один раз после загрузки (страница статическая)
    const q = new URLSearchParams(window.location.search)
    /* eslint-disable react-hooks/set-state-in-effect */
    if (q.get('cat') === 'monitors') { setCat('monitors'); if (!q.get('w')) { setW(imperialDefault ? '31.5' : '80'); setH(imperialDefault ? '19.7' : '50') } }
    const cv = (x: string) => (imperialDefault ? String(Math.round((Number(x) / IN) * 10) / 10) : x)
    if (q.get('w')) setW(cv(q.get('w')!))
    if (q.get('h')) setH(cv(q.get('h')!))
    if (q.get('d')) setD(cv(q.get('d')!))
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [imperialDefault])
  const [loaded, setLoaded] = useState<Cat | null>(null)
  useEffect(() => {
    let off = false
    fetch(`/api/sizes?lang=${lang}&cat=${cat}`).then((r) => r.json()).then((j) => { if (!off) { setItems(j.items ?? []); setBase(j.base ?? null); setLoaded(cat) } })
      .catch(() => { if (!off) { setItems([]); setLoaded(cat) } })
    return () => { off = true }
  }, [lang, cat])

  const toMm = (v: string) => { const n = Number(v.replace(',', '.')); return Number.isFinite(n) && n > 0 ? n * (imp ? IN : 1) * 10 : null }
  const w = toMm(W), h = toMm(H), d = toMm(D), g = toMm(gap) ?? 0
  useEffect(() => {
    if (!w || !h) return
    const cm = (x: number) => String(Math.round(x / 10))
    const q = new URLSearchParams({ cat, w: cm(w), h: cm(h), ...(d ? { d: cm(d) } : {}) })
    window.history.replaceState(null, '', `${window.location.pathname}?${q}`)
  }, [cat, w, h, d])
  const edit = (set: (s: string) => void) => (v: string) => { set(v); setShown(PAGE); setPick(null) }

  const fits = useMemo(() => {
    if (!items || !w || !h) return []
    return items.filter((x) => x.dg && x.w + 2 * g <= w && x.h + 2 * g <= h && (!d || x.d == null || x.d <= d))
      .sort((a, b) => (b.dg ?? 0) - (a.dg ?? 0) || a.w - b.w)
  }, [items, w, h, d, g])
  const sizes = useMemo(() => {
    const m = new Map<number, number>()
    for (const x of fits) { const k = Math.round(x.dg!); m.set(k, (m.get(k) ?? 0) + 1) }
    return [...m].sort((a, b) => b[0] - a[0])
  }, [fits])
  const list = pick == null ? fits : fits.filter((x) => Math.round(x.dg!) === pick)
  const best = fits[0]
  const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 })
  const uf = new Intl.NumberFormat(lang, { style: 'unit', unit: imp ? 'inch' : 'centimeter', maximumFractionDigits: 1 })
  const len = (mm: number) => uf.format(imp ? mm / 25.4 : mm / 10)

  const unit = uf.formatToParts(1).find((x) => x.type === 'unit')?.value ?? (imp ? 'in' : 'cm')
  const field = (label: string, v: string, set: (s: string) => void, ph?: string) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <span className="flex h-12 items-center rounded-xl border border-border px-3 focus-within:border-accent">
        <input inputMode="decimal" value={v} placeholder={ph} onChange={(e) => set(e.target.value)} className="num w-full bg-transparent text-base outline-none" />
        <span className="text-sm text-muted">{unit}</span>
      </span>
    </label>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {(['tvs', 'monitors'] as Cat[]).map((c) => (
          <button key={c} type="button" onClick={() => { setCat(c); setShown(PAGE); setPick(null) }}
            aria-pressed={cat === c} className={`min-h-11 rounded-xl border px-4 font-medium ${cat === c ? 'border-accent bg-accent text-white' : 'border-border hover:border-accent'}`}>{c === 'tvs' ? f.tv : f.monitor}</button>
        ))}
        <span className="ms-auto inline-flex overflow-hidden rounded-xl border border-border text-sm">
          {[false, true].map((x) => (
            <button key={String(x)} type="button" aria-pressed={imp === x}
              onClick={() => { if (imp === x) return; const k = x ? 1 / IN : IN; const cv = (s: string) => (s ? String(Math.round(Number(s.replace(',', '.')) * k * 10) / 10) : s); setW(cv(W)); setH(cv(H)); setD(cv(D)); setGap(cv(gap)); setImp(x) }}
              className={`min-h-11 px-3 ${imp === x ? 'bg-surface font-semibold' : ''}`}>{x ? t.imperial : t.metric}</button>
          ))}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {field(f.width, W, edit(setW))}
        {field(f.height, H, edit(setH))}
        {field(f.depth, D, edit(setD), '—')}
        {field(f.gap, gap, edit(setGap))}
      </div>
      <p className="text-sm text-muted">{cat === 'tvs' ? f.noteTv : f.noteMonitor}</p>

      {!items || loaded !== cat ? <p className="text-muted">…</p> : !w || !h ? null : !fits.length ? (
        <p className="rounded-2xl border border-border bg-surface p-4">{f.none}</p>
      ) : (
        <>
          <div className="grid items-center gap-6 rounded-2xl border border-border p-4 md:grid-cols-[1fr_16rem]">
            <div>
              <p className="text-lg">{f.result.replace('{n}', String(fits.length)).replace('{size}', nf.format(best.dg!))}</p>
              <p className="mt-1 text-sm text-muted">{f.best}: <a href={base ? `${base}/${best.s}` : undefined} className="font-medium text-accent hover:underline">{best.n}</a> — {len(best.w)} × {len(best.h)}{best.ap ? ' ≈' : ''}</p>
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={f.sizes}>
                <button type="button" onClick={() => setPick(null)} aria-pressed={pick == null}
                  className={`num min-h-10 rounded-lg border px-3 text-sm ${pick == null ? 'border-accent bg-accent/10 font-semibold' : 'border-border'}`}>{f.all} · {fits.length}</button>
                {sizes.map(([s, n]) => (
                  <button key={s} type="button" onClick={() => { setPick(s); setShown(PAGE) }} aria-pressed={pick === s}
                    className={`num min-h-10 rounded-lg border px-3 text-sm ${pick === s ? 'border-accent bg-accent/10 font-semibold' : 'border-border'}`}>{s}″ · {n}</button>
                ))}
              </div>
            </div>
            {/* схема: ниша и самый большой экран в масштабе */}
            <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto max-h-48 w-full" role="img" aria-label={`${len(w)} × ${len(h)}`}>
              <rect x={0} y={0} width={w} height={h} fill="none" stroke="currentColor" strokeOpacity={0.4} strokeWidth={Math.max(w, h) / 120} strokeDasharray={`${w / 40} ${w / 60}`} />
              <rect x={(w - best.w) / 2} y={(h - best.h) / 2} width={best.w} height={best.h} rx={Math.max(w, h) / 200} fill="#2f5bea22" stroke="#2f5bea" strokeWidth={Math.max(w, h) / 150} />
              <text x={w / 2} y={h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(best.h / 3, w / 8)} fill="#2f5bea" fontWeight={700}>{nf.format(best.dg!)}″</text>
            </svg>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.slice(0, shown).map((x) => (
              <li key={x.s}>
                <a href={base ? `${base}/${x.s}` : undefined} className="flex h-full items-center gap-3 rounded-xl border border-border p-3 hover:border-accent">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {x.img ? <img src={x.img} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-lg bg-white object-contain p-1" /> : <span className="h-14 w-14 shrink-0 rounded-lg bg-surface" />}
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{x.n}</span>
                    <span className="num block text-sm text-muted">{nf.format(x.dg!)}″ · {len(x.w)} × {len(x.h)}{x.d ? ` × ${len(x.d)}` : ''}{x.ap ? ' ≈' : ''}</span>
                    <span className="num block text-xs text-muted">{f.spare.replace('{w}', len(w - x.w)).replace('{h}', len(h - x.h))}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {list.length > shown && <button type="button" onClick={() => setShown(shown + PAGE)} className="min-h-11 rounded-xl border border-border px-4 font-medium hover:border-accent">{f.more} ({list.length - shown})</button>}
          {fits.some((x) => x.ap) && <p className="text-xs text-muted">{f.noteEst}</p>}
        </>
      )}
    </div>
  )
}
