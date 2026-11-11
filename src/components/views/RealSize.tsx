'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ToolsText } from '@/lib/tools'

// «Реальный размер»: калибровка экрана по банковской карте (ISO/IEC 7810 ID-1, 85,60 × 53,98 мм),
// затем модели в натуральную величину — рядом или наложением. Режим «ТВ на стене»: фото комнаты + лист A4 как эталон.
type Item = { s: string; n: string; img: string | null; w: number; h: number; d: number | null; dg: number | null; ap: boolean }
const CARD_W = 85.6, CARD_H = 53.98
const KEY = 'sv_px_per_mm'
const COLORS = ['#2f5bea', '#e0457b']

function useItems(lang: string, cat: string) {
  const [items, setItems] = useState<Item[] | null>(null)
  useEffect(() => {
    let off = false
    setItems(null)
    fetch(`/api/sizes?lang=${lang}&cat=${cat}`).then((r) => r.json()).then((j) => { if (!off) setItems(j.items ?? []) }).catch(() => { if (!off) setItems([]) })
    return () => { off = true }
  }, [lang, cat])
  return items
}

function Picker({ label, items, value, onChange, placeholder }: { label: string; items: Item[]; value: Item | null; onChange: (x: Item | null) => void; placeholder: string }) {
  const [q, setQ] = useState('')
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (t.length < 2) return []
    return items.filter((x) => x.n.toLowerCase().includes(t)).slice(0, 8)
  }, [q, items])
  return (
    <div className="relative">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {value ? (
        <div className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-border px-3">
          <span className="truncate">{value.n}</span>
          <button type="button" onClick={() => onChange(null)} className="text-sm text-muted hover:text-fg" aria-label="×">✕</button>
        </div>
      ) : (
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-border bg-bg px-3 text-base" />
      )}
      {!value && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-bg shadow-lg">
          {hits.map((x) => <li key={x.s}><button type="button" onClick={() => { onChange(x); setQ('') }} className="block w-full px-3 py-2 text-start hover:bg-surface">{x.n}</button></li>)}
        </ul>
      )}
    </div>
  )
}

function Calibrate({ t, pxmm, setPxmm }: { t: ToolsText['size']; pxmm: number; setPxmm: (v: number) => void }) {
  return (
    <div>
      <h2 className="font-semibold">{t.calTitle}</h2>
      <p className="mt-1 text-sm text-muted">{t.calText}</p>
      <div className="mt-3 overflow-x-auto">
        <div style={{ width: CARD_W * pxmm, height: CARD_H * pxmm }} className="relative rounded-[3.18mm] border-2 border-dashed border-accent bg-accent/5">
          <span className="absolute start-2 top-2 h-5 w-7 rounded bg-accent/30" aria-hidden="true" />
          <span className="num absolute bottom-1 end-2 text-xs text-muted">85.6 × 54 mm</span>
        </div>
      </div>
      <input type="range" min={2} max={12} step={0.01} value={pxmm} onChange={(e) => setPxmm(Number(e.target.value))} className="mt-3 w-full max-w-md" aria-label={t.calTitle} />
      <p className="mt-1 text-xs text-muted">{t.calHint}</p>
    </div>
  )
}

function Device({ it, pxmm, color, cat, dashed }: { it: Item; pxmm: number; color: string; cat: string; dashed?: boolean }) {
  const W = it.w * pxmm, H = it.h * pxmm
  const r = cat === 'smartwatches' ? Math.min(W, H) * 0.28 : cat === 'tvs' ? 4 : Math.min(W, H) * 0.12
  // экран: по диагонали, если известна, иначе отступ рамок
  let sw = W - 2 * Math.max(2, 2 * pxmm), sh = H - 2 * Math.max(2, 4 * pxmm)
  if (it.dg && cat !== 'smartwatches') {
    const ratio = sh / sw, dpx = it.dg * 25.4 * pxmm
    const x = dpx / Math.hypot(1, ratio)
    if (x < W && x * ratio < H) { sw = x; sh = x * ratio }
  }
  return (
    <svg width={W + 2} height={H + 2} viewBox={`-1 -1 ${W + 2} ${H + 2}`} className="block shrink-0" role="img" aria-label={it.n}>
      <rect x={0} y={0} width={W} height={H} rx={r} fill={dashed ? 'none' : `${color}14`} stroke={color} strokeWidth={2} strokeDasharray={dashed ? '6 4' : undefined} />
      {!dashed && <rect x={(W - sw) / 2} y={(H - sh) / 2} width={sw} height={sh} rx={Math.max(2, r * 0.7)} fill={`${color}22`} />}
    </svg>
  )
}

export function RealSize({ t, lang, mode }: { t: ToolsText; lang: string; mode: 'size' | 'wall' }) {
  // ?cat=&a=&b= из адреса читаем в браузере (страница остаётся статической)
  const [init, setInit] = useState<{ cat?: string; a?: string; b?: string } | null>(null)
  useEffect(() => { const q = new URLSearchParams(window.location.search); setInit({ cat: q.get('cat') ?? undefined, a: q.get('a') ?? undefined, b: q.get('b') ?? undefined }) }, [])
  const [pxmm, setPxmmS] = useState(3.78)
  const [calibrated, setCalibrated] = useState(false)
  useEffect(() => {
    try { const v = Number(localStorage.getItem(KEY)); if (v > 1 && v < 20) { setPxmmS(v); setCalibrated(true) } else if (window.matchMedia('(pointer:coarse)').matches) setPxmmS(6.3) } catch { /* без хранилища — калибровка на сессию */ }
  }, [])
  const setPxmm = (v: number) => { setPxmmS(v); try { localStorage.setItem(KEY, String(v)) } catch { /* ignore */ } }
  if (!init) return null
  if (mode === 'wall') return <Wall t={t} lang={lang} init={init} />
  return <SizeCompare t={t} lang={lang} pxmm={pxmm} setPxmm={setPxmm} calibrated={calibrated} setCalibrated={setCalibrated} init={init} />
}

function SizeCompare({ t, lang, pxmm, setPxmm, calibrated, setCalibrated, init }: { t: ToolsText; lang: string; pxmm: number; setPxmm: (v: number) => void; calibrated: boolean; setCalibrated: (v: boolean) => void; init?: { cat?: string; a?: string; b?: string } }) {
  const s = t.size
  const CATS = [['smartphones', s.phones], ['tablets', s.tablets], ['smartwatches', s.watches]] as const
  const [cat, setCat] = useState(init?.cat && CATS.some(([k]) => k === init.cat) ? init.cat : 'smartphones')
  const items = useItems(lang, cat)
  const [a, setA] = useState<Item | null>(null), [b, setB] = useState<Item | null>(null)
  const [view, setView] = useState<'side' | 'overlay'>('side')
  const inited = useRef(false)
  useEffect(() => {
    if (!items || inited.current) return
    inited.current = true
    const fa = init?.a && items.find((x) => x.s === init.a), fb = init?.b && items.find((x) => x.s === init.b)
    setA(fa || items[0] || null); if (fb) setB(fb)
  }, [items, init])
  // на узком экране две модели рядом не помещаются — сразу показываем наложением
  useEffect(() => { if (a && b && typeof window !== 'undefined' && (a.w + b.w) * pxmm + 48 > window.innerWidth - 32) setView('overlay') }, [a, b, pxmm])
  const f = (v: number) => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(v)
  const dims = (x: Item) => s.dims.replace('{w}', f(x.w)).replace('{h}', f(x.h)).replace('{d}', x.d ? f(x.d) : '—')
  const sel = [a, b].filter((x): x is Item => !!x)
  const cmp = a && b ? (() => {
    const [big, small] = a.w * a.h >= b.w * b.h ? [a, b] : [b, a]
    const pct = Math.round((big.w * big.h / (small.w * small.h) - 1) * 100)
    return pct < 2 ? s.same : s.diff.replace('{a}', big.n).replace('{b}', small.n).replace('{pct}', String(pct))
  })() : null
  return (
    <div className="space-y-6">
      {!calibrated ? (
        <div>
          <Calibrate t={s} pxmm={pxmm} setPxmm={setPxmm} />
          <button type="button" onClick={() => setCalibrated(true)} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-medium text-accent-fg">{s.calDone} ✓</button>
        </div>
      ) : (
        <p className="text-sm text-muted">✓ {s.calDone} · <button type="button" onClick={() => setCalibrated(false)} className="text-accent hover:underline">{s.calReset}</button></p>
      )}
      <div>
        <h2 className="mb-2 font-semibold">{s.pickTitle}</h2>
        <div className="mb-3 inline-flex rounded-xl border border-border p-1 text-sm" role="group" aria-label={s.category}>
          {CATS.map(([k, label]) => <button key={k} type="button" aria-pressed={cat === k} onClick={() => { setCat(k); setA(null); setB(null); inited.current = false }}
            className={`rounded-lg px-3 py-1.5 ${cat === k ? 'bg-accent text-accent-fg' : 'text-muted'}`}>{label}</button>)}
        </div>
        {!items ? <p className="text-sm text-muted">{s.loading}</p> : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Picker label={s.modelA} items={items} value={a} onChange={setA} placeholder={s.search} />
            <Picker label={s.modelB} items={items} value={b} onChange={setB} placeholder={s.search} />
          </div>
        )}
      </div>
      {sel.length > 0 && (
        <div>
          {sel.length === 2 && (
            <div className="mb-3 inline-flex rounded-xl border border-border p-1 text-sm" role="group" aria-label={s.view}>
              {([['side', s.side], ['overlay', s.overlay]] as const).map(([k, label]) => <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}
                className={`rounded-lg px-3 py-1.5 ${view === k ? 'bg-accent text-accent-fg' : 'text-muted'}`}>{label}</button>)}
            </div>
          )}
          <div className="overflow-x-auto pb-2">
            {view === 'overlay' && sel.length === 2 ? (
              <div className="relative" style={{ width: Math.max(a!.w, b!.w) * pxmm + 4, height: Math.max(a!.h, b!.h) * pxmm + 4 }}>
                {sel.map((x, i) => <div key={x.s} className="absolute start-0 bottom-0"><Device it={x} pxmm={pxmm} color={COLORS[i]} cat={cat} dashed={i === 1} /></div>)}
              </div>
            ) : (
              <div className="flex items-end gap-6">
                {sel.map((x, i) => <Device key={x.s} it={x} pxmm={pxmm} color={COLORS[i]} cat={cat} />)}
              </div>
            )}
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {sel.map((x, i) => (
              <li key={x.s}><span className="me-2 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: COLORS[i] }} />
                <span className="font-medium">{x.n}</span> · <span className="num">{dims(x)}</span>{x.ap && <span className="block ps-5 text-xs text-muted">{s.approx}</span>}</li>
            ))}
          </ul>
          {cmp && <p className="mt-2 font-medium">{cmp}</p>}
          <p className="mt-3 text-sm text-muted">{s.tip}</p>
        </div>
      )}
    </div>
  )
}

// ---------- ТВ на стене: фото + лист A4 как эталон масштаба ----------
function Wall({ t, lang, init }: { t: ToolsText; lang: string; init?: { a?: string } }) {
  const w = t.wall
  const items = useItems(lang, 'tvs')
  const [img, setImg] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)
  // эталон A4 (книжная ориентация) и ТВ — в долях ширины фото
  const [a4, setA4] = useState({ x: 0.1, y: 0.2, w: 0.12 })
  const [tv, setTv] = useState({ x: 0.35, y: 0.25 })
  const [inch, setInch] = useState(55)
  const [model, setModel] = useState<Item | null>(null)
  useEffect(() => { if (items && init?.a && !model) { const m = items.find((x) => x.s === init.a); if (m) setModel(m) } }, [items, init, model])
  useEffect(() => () => { if (img) URL.revokeObjectURL(img) }, [img])
  const [size, setSize] = useState({ W: 0, H: 0 })
  useEffect(() => {
    const el = box.current; if (!el) return
    const ro = new ResizeObserver(() => setSize({ W: el.clientWidth, H: el.clientHeight })); ro.observe(el); return () => ro.disconnect()
  }, [img])
  const pxmm = (a4.w * size.W) / 210 // пикселей фото на мм стены
  const tvmm = model ? { w: model.w, h: model.h } : (() => { const k = (inch * 25.4) / Math.hypot(16, 9); return { w: 16 * k + 20, h: 9 * k + 20 } })()
  const drag = (kind: 'a4' | 'tv' | 'a4size') => (e: React.PointerEvent) => {
    e.preventDefault()
    const el = box.current; if (!el) return
    const r = el.getBoundingClientRect(), sx = e.clientX, sy = e.clientY
    const start = kind === 'tv' ? { ...tv } : { ...a4 }
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / r.width, dy = (ev.clientY - sy) / r.width
      if (kind === 'tv') setTv({ x: (start as typeof tv).x + dx, y: (start as typeof tv).y + dy })
      else if (kind === 'a4') setA4({ ...(start as typeof a4), x: (start as typeof a4).x + dx, y: (start as typeof a4).y + dy })
      else setA4({ ...(start as typeof a4), w: Math.max(0.02, (start as typeof a4).w + dx) })
    }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }
  return (
    <div className="space-y-4">
      <ol className="space-y-1 text-sm">{[w.step1, w.step2, w.step3].map((x) => <li key={x}>{x}</li>)}</ol>
      {!img ? (
        <label className="inline-flex min-h-12 cursor-pointer items-center rounded-xl bg-accent px-4 font-medium text-accent-fg">
          📷 {w.upload}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setImg(URL.createObjectURL(f)) }} />
        </label>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-medium">{w.size}: <span className="num">{inch}″</span></span>
              <input type="range" min={24} max={100} step={1} value={inch} onChange={(e) => { setInch(Number(e.target.value)); setModel(null) }} className="w-full" disabled={!!model} /></label>
            {items && <Picker label={w.model} items={items} value={model} onChange={setModel} placeholder={t.size.search} />}
          </div>
          <div ref={box} className="relative w-full touch-none select-none overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="block w-full" draggable={false} />
            {size.W > 0 && <>
              <div onPointerDown={drag('a4')} className="absolute cursor-move border-2 border-accent bg-accent/15"
                style={{ left: a4.x * size.W, top: a4.y * size.W, width: a4.w * size.W, height: a4.w * size.W * (297 / 210) }}>
                <span className="absolute -top-5 start-0 whitespace-nowrap rounded bg-accent px-1 text-[10px] text-accent-fg">{w.scaleHint}</span>
                <span onPointerDown={(e) => { e.stopPropagation(); drag('a4size')(e) }} className="absolute -bottom-2 -end-2 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-accent" />
              </div>
              <div onPointerDown={drag('tv')} className="absolute cursor-move rounded-[3px] border-[3px] border-neutral-900 bg-neutral-900/85 shadow-2xl"
                style={{ left: tv.x * size.W, top: tv.y * size.W, width: tvmm.w * pxmm, height: tvmm.h * pxmm }}>
                <span className="num absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">{model ? model.n : `${inch}″`}</span>
              </div>
            </>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="num text-muted">{Math.round(tvmm.w / 10)} × {Math.round(tvmm.h / 10)} cm</span>
            <button type="button" onClick={() => setImg(null)} className="rounded-lg border border-border px-3 py-1.5 hover:border-accent">{w.reset}</button>
          </div>
        </>
      )}
      <p className="text-xs text-muted">{w.privacy}</p>
    </div>
  )
}
