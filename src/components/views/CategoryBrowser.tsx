'use client'
import { useMemo, useState } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { ProductCardData } from '@/lib/types'
import { ProductCard } from '../product/ProductCard'
import { CompareTray } from '../compare/CompareTray'

export type BrowserStrings = {
  filters: string; sort: string; sortNew: string; sortName: string; sortHigh: string; sortLow: string; from: string; to: string; any: string
  reset: string; showMore: string; models: string; noMatch: string; brand: string; yesOnly: string
  addCompare: string; inCompare: string; compareNow: string; pickOneMore: string; clearAll: string; remove: string; vs: string
}
type FilterDef = { key: string; label: string; type: string; hib: boolean | null }
type Item = ProductCardData & { release?: string | null }
type NumRange = { min?: number; max?: number }

const PAGE = 48
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''))

/**
 * Каталог категории: фильтры (бренд + характеристики), сортировка, «показать ещё», выбор для сравнения.
 * Всё считается в браузере по уже загруженному списку — мгновенно, без перезагрузки.
 */
export function CategoryBrowser({ lang, items, filters, brands, s, compare }:
  { lang: Locale; items: Item[]; filters: FilterDef[]; brands: string[]; s: BrowserStrings; compare: { cat: string; base: string } }) {
  const [brandSel, setBrandSel] = useState<string[]>([])
  const [nums, setNums] = useState<Record<string, NumRange>>({})
  const [bools, setBools] = useState<string[]>([])
  const [texts, setTexts] = useState<Record<string, string[]>>({})
  const [sort, setSort] = useState('new')
  const [limit, setLimit] = useState(PAGE)
  const [sheet, setSheet] = useState(false)

  // варианты значений для каждого фильтра (только те, что реально встречаются)
  const options = useMemo(() => {
    const out: Record<string, { v: number | string | boolean; d: string; n: number }[]> = {}
    for (const f of filters) {
      const m = new Map<string, { v: number | string | boolean; d: string; n: number }>()
      for (const it of items) {
        const x = it.facets?.[f.key]; if (!x || x.v == null) continue
        const k = String(x.v); const e = m.get(k)
        if (e) e.n++; else m.set(k, { v: x.v, d: x.d, n: 1 })
      }
      const arr = [...m.values()]
      if (f.type === 'number') arr.sort((a, b) => (a.v as number) - (b.v as number))
      else arr.sort((a, b) => b.n - a.n)
      out[f.key] = arr
    }
    return out
  }, [items, filters])

  const usable = filters.filter((f) => {
    const o = options[f.key] ?? []
    if (f.type === 'bool') return o.some((x) => x.v === true) && o.reduce((a, x) => a + x.n, 0) > 1
    return o.length > 1
  })

  const sorts = useMemo(() => {
    const list: { id: string; label: string }[] = [{ id: 'new', label: s.sortNew }, { id: 'name', label: s.sortName }]
    for (const f of usable) if (f.type === 'number' && f.hib != null) list.push({ id: `${f.key}:${f.hib ? 'desc' : 'asc'}`, label: fill(f.hib ? s.sortHigh : s.sortLow, { label: f.label }) })
    return list
  }, [usable, s])

  const active = brandSel.length + bools.length + Object.values(texts).filter((v) => v.length).length
    + Object.values(nums).filter((r) => r.min != null || r.max != null).length

  const shown = useMemo(() => {
    let list = items.filter((it) => {
      if (brandSel.length && !brandSel.includes(it.brand)) return false
      for (const k of bools) if (it.facets?.[k]?.v !== true) return false
      for (const [k, vals] of Object.entries(texts)) if (vals.length && !vals.includes(String(it.facets?.[k]?.v))) return false
      for (const [k, r] of Object.entries(nums)) {
        if (r.min == null && r.max == null) continue
        const v = it.facets?.[k]?.v
        if (typeof v !== 'number') return false
        if (r.min != null && v < r.min) return false
        if (r.max != null && v > r.max) return false
      }
      return true
    })
    if (sort === 'name') list = [...list].sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, lang))
    else if (sort !== 'new') {
      const [k, dir] = sort.split(':')
      list = [...list].sort((a, b) => {
        const x = a.facets?.[k]?.v, y = b.facets?.[k]?.v
        if (typeof x !== 'number') return 1
        if (typeof y !== 'number') return -1
        return dir === 'desc' ? y - x : x - y
      })
    }
    return list
  }, [items, brandSel, bools, texts, nums, sort, lang])

  const reset = () => { setBrandSel([]); setNums({}); setBools([]); setTexts({}); setLimit(PAGE) }
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const chip = (on: boolean) => `shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${on ? 'border-accent bg-accent-soft text-accent' : 'border-border hover:border-accent'}`

  const panel = (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{s.brand}</legend>
        <div className="flex flex-wrap gap-1.5">
          {brands.map((b) => (
            <button key={b} type="button" aria-pressed={brandSel.includes(b)} className={chip(brandSel.includes(b))}
              onClick={() => { setBrandSel(toggle(brandSel, b)); setLimit(PAGE) }}>{b}</button>
          ))}
        </div>
      </fieldset>
      {usable.map((f) => {
        const o = options[f.key]
        if (f.type === 'number') {
          const r = nums[f.key] ?? {}
          const sel = (which: 'min' | 'max') => (
            <select aria-label={`${f.label}: ${which === 'min' ? s.from : s.to}`} value={r[which] ?? ''}
              onChange={(e) => { setNums({ ...nums, [f.key]: { ...r, [which]: e.target.value === '' ? undefined : Number(e.target.value) } }); setLimit(PAGE) }}
              className="h-10 w-full rounded-xl border border-border bg-bg px-2 text-sm">
              <option value="">{which === 'min' ? s.from : s.to}: {s.any}</option>
              {o.map((x) => <option key={String(x.v)} value={String(x.v)}>{x.d}</option>)}
            </select>
          )
          return (
            <fieldset key={f.key}>
              <legend className="mb-2 text-sm font-semibold">{f.label}</legend>
              <div className="grid grid-cols-2 gap-2">{sel('min')}{sel('max')}</div>
            </fieldset>
          )
        }
        if (f.type === 'bool') {
          const on = bools.includes(f.key)
          return (
            <button key={f.key} type="button" aria-pressed={on} className={`${chip(on)} w-full text-start`}
              onClick={() => { setBools(toggle(bools, f.key)); setLimit(PAGE) }}>
              {f.label}: {s.yesOnly}
            </button>
          )
        }
        const cur = texts[f.key] ?? []
        return (
          <fieldset key={f.key}>
            <legend className="mb-2 text-sm font-semibold">{f.label}</legend>
            <div className="flex flex-wrap gap-1.5">
              {o.slice(0, 12).map((x) => {
                const v = String(x.v)
                return <button key={v} type="button" aria-pressed={cur.includes(v)} className={chip(cur.includes(v))}
                  onClick={() => { setTexts({ ...texts, [f.key]: toggle(cur, v) }); setLimit(PAGE) }}>{x.d}</button>
              })}
            </div>
          </fieldset>
        )
      })}
      {active > 0 && <button type="button" onClick={reset} className="text-sm font-medium text-accent hover:underline">{s.reset}</button>}
    </div>
  )

  return (
    <div className="mt-5 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pe-1 no-scrollbar">
          <h2 className="mb-3 font-semibold">{s.filters}</h2>
          {panel}
        </div>
      </aside>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <button type="button" onClick={() => setSheet(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium lg:hidden">
            {s.filters}{active > 0 && <span className="num rounded-full bg-accent px-1.5 text-xs text-accent-fg">{active}</span>}
          </button>
          <span className="num text-sm text-muted">{fill(s.models, { n: shown.length })}</span>
          <label className="ms-auto flex items-center gap-2 text-sm">
            <span className="hidden text-muted sm:inline">{s.sort}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 max-w-[12rem] rounded-xl border border-border bg-bg px-2 text-sm">
              {sorts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
        </div>

        {shown.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {shown.slice(0, limit).map((p) => (
              <ProductCard key={p.slug} lang={lang} p={p}
                compare={{ item: { slug: p.slug, name: `${p.brand} ${p.name}`, brand: p.brand, image: p.image, cat: compare.cat, base: compare.base }, label: s.addCompare, active: s.inCompare }} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
            <p>{s.noMatch}</p>
            <button type="button" onClick={reset} className="mt-3 text-sm font-medium text-accent hover:underline">{s.reset}</button>
          </div>
        )}
        {shown.length > limit && (
          <div className="mt-6 text-center">
            <button type="button" onClick={() => setLimit(limit + PAGE)} className="h-11 rounded-xl border border-border px-6 text-sm font-semibold hover:border-accent">
              {s.showMore} ({shown.length - limit})
            </button>
          </div>
        )}
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={s.filters}>
          <button type="button" aria-label="×" className="absolute inset-0 bg-black/40" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-bg p-4 pb-24">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{s.filters}</h2>
              <button type="button" onClick={() => setSheet(false)} className="h-9 w-9 rounded-full text-xl text-muted hover:bg-surface" aria-label="×">×</button>
            </div>
            {panel}
            <div className="fixed inset-x-0 bottom-0 border-t border-border bg-bg p-3">
              <button type="button" onClick={() => setSheet(false)} className="h-12 w-full rounded-xl bg-accent text-sm font-semibold text-accent-fg">
                {fill(s.models, { n: shown.length })}
              </button>
            </div>
          </div>
        </div>
      )}

      <CompareTray s={s} />
    </div>
  )
}
