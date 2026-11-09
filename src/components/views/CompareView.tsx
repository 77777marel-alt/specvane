import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { ProductView as P } from '@/lib/types'
import { fill, money } from '@/lib/format'
import { Breadcrumbs, type Crumb } from '../Breadcrumbs'
import { ProductImage } from '../product/ProductImage'
import { CompareTable } from '../product/CompareTable'
import { Radar } from '../charts/Radar'
import { GainLose } from '../charts/GainLose'
import { WeightScore } from '../charts/WeightScore'
import { SizeOverlay } from '../charts/SizeOverlay'

/** Сравнение A vs B: карточки сверху, итог «берите A, если… / B, если…», таблица с подсветкой. */
export function CompareView({ lang, t, items, crumbs, chooseIf, title, radar }:
  { lang: Locale; t: Dict; items: P[]; crumbs: Crumb[]; chooseIf?: string[][]; title?: string
    radar?: { axes: string[]; series: { name: string; values: number[] }[] } }) {
  // размеры в масштабе: ширина × высота (мм) у обеих моделей
  const dim = (it: P, k: string) => { const v = it.specGroups.flatMap((g) => g.specs).find((x) => x.key === k)?.value; return typeof v === 'number' ? v : null }
  const sizes = items.map((it) => ({ name: `${it.brand} ${it.name}`, w: dim(it, 'width'), h: dim(it, 'height') }))
  const size = items.length === 2 && sizes.every((x) => x.w && x.h)
    ? <div className="mt-6"><SizeOverlay items={sizes as { name: string; w: number; h: number }[]} title={t.ui.sizeTitle} note={t.ui.sizeNote} /></div> : null
  // строки — объединение характеристик обеих моделей по ключу, в порядке групп
  const find = (it: P, key: string) => it.specGroups.flatMap((g) => g.specs).find((x) => x.key === key)
  const order: { group: string; key: string; label: string; hib?: boolean | null }[] = []
  for (const it of items) for (const g of it.specGroups) for (const sp of g.specs)
    if (!order.some((o) => o.key === sp.key)) order.push({ group: g.name, key: sp.key, label: sp.label, hib: sp.higherIsBetter })
  const groupNames = [...new Set(order.map((o) => o.group))]
  const groups = groupNames.map((name) => ({
    name,
    rows: order.filter((o) => o.group === name).map((o) => ({
      key: o.key, label: o.label, higherIsBetter: o.hib,
      values: items.map((it) => { const v = find(it, o.key); return { display: v?.display ?? '—', value: v?.value ?? null } }),
    })),
  }))
  const best = (p: P) => p.offers.filter((o) => o.inStock && o.price != null).sort((a, b) => a.price! - b.price!)[0]
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        {title ?? items.map((i) => `${i.brand} ${i.name}`).join(` ${t.ui.vs} `)}
      </h1>
      <div className={`mt-6 grid gap-3 ${items.length > 2 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
        {items.map((p) => {
          const o = best(p)
          return (
            <div key={p.slug} className="rounded-2xl border border-border p-3">
              <a href={p.href} className="group block">
                <ProductImage src={p.image} alt={`${p.brand} ${p.name}`} ratio="aspect-[4/3] md:aspect-[16/7]" className="transition-transform group-hover:scale-[1.02]" />
                <div className="mt-3 text-xs text-muted">{p.brand}</div>
                <div className="font-semibold group-hover:text-accent">{p.name}</div>
              </a>
              {o ? (
                <a href={o.url} rel="sponsored nofollow noopener" target="_blank"
                  className="num mt-3 flex h-10 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-fg">
                  {money(lang, o.price!, o.currency)} · {o.shop}
                </a>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {p.keySpecs.slice(0, 4).map((k) => <li key={k.key} className="num rounded-md bg-surface px-1.5 py-0.5 text-xs">{k.display}</li>)}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {(() => {
        // Где каждая модель лучше — прямо из цифр таблицы (без сочинённого текста)
        const adv = chooseIf ?? (items.length !== 2 ? [] : items.map((_, i) => groups.flatMap((g) => g.rows).filter((r) => {
          if (r.higherIsBetter == null) return false
          const v = r.values.map((x) => (typeof x.value === 'number' ? x.value : typeof x.value === 'boolean' ? Number(x.value) : NaN))
          if (v.some(Number.isNaN) || v[0] === v[1] || r.values[0].display === r.values[1].display) return false
          return r.higherIsBetter ? v[i] > v[1 - i] : v[i] < v[1 - i]
        }).map((r) => `${r.label}: ${r.values[i].display} ${t.ui.vs} ${r.values[1 - i].display}`)))
        if (!adv.some((a) => a.length)) return null
        return (
          <section aria-labelledby="choose" className="mt-8 grid gap-3 md:grid-cols-2">
            <h2 id="choose" className="sr-only">{t.ui.verdict}</h2>
            {items.map((p, i) => (
              <div key={p.slug} className="rounded-2xl border border-border bg-surface p-4">
                <h3 className="font-semibold">{fill(t.ui.chooseIf, { name: p.name })}…</h3>
                {adv[i]?.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-muted">{adv[i].map((c) => <li key={c} className="num">✓ {c}</li>)}</ul>
                ) : <p className="mt-2 text-sm text-muted">—</p>}
              </div>
            ))}
          </section>
        )
      })()}

      {items.length === 2 && (
        <div className="mt-10">
          <GainLose rows={groups.flatMap((g) => g.rows)} from={`${items[0].brand} ${items[0].name}`} to={`${items[1].brand} ${items[1].name}`} s={t.ui} />
        </div>
      )}
      {radar && <div className="mt-6"><Radar axes={radar.axes} series={radar.series} title={t.ui.radarTitle} note={t.ui.radarNote} /></div>}
      {radar && <div className="mt-6"><WeightScore axes={radar.axes} series={radar.series} s={t.ui} /></div>}
      {size}

      <section aria-labelledby="table" className="mt-10">
        <h2 id="table" className="mb-3 text-xl font-semibold">{t.ui.allSpecs}</h2>
        <CompareTable cols={items.map((p) => ({ name: p.name, brand: p.brand, href: p.href }))} groups={groups}
          labels={{ onlyDiff: t.ui.onlyDiff, better: t.ui.better }} />
      </section>
      <p className="mt-6 text-xs text-muted">{t.ui.source}</p>
    </>
  )
}
