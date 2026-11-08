import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { ProductView as P } from '@/lib/types'
import { fill, money } from '@/lib/format'
import { Breadcrumbs, type Crumb } from '../Breadcrumbs'
import { ProductImage } from '../product/ProductImage'
import { CompareTable } from '../product/CompareTable'

/** Сравнение A vs B: карточки сверху, итог «берите A, если… / B, если…», таблица с подсветкой. */
export function CompareView({ lang, t, items, crumbs, chooseIf }:
  { lang: Locale; t: Dict; items: P[]; crumbs: Crumb[]; chooseIf: string[][] }) {
  const groups = items[0].specGroups.map((g, gi) => ({
    name: g.name,
    rows: g.specs.map((s, si) => ({
      key: s.key, label: s.label, higherIsBetter: s.higherIsBetter,
      values: items.map((it) => {
        const v = it.specGroups[gi]?.specs[si]
        return { display: v?.display ?? '—', value: v?.value ?? null }
      }),
    })),
  }))
  const best = (p: P) => p.offers.filter((o) => o.inStock && o.price != null).sort((a, b) => a.price! - b.price!)[0]
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        {items.map((i) => `${i.brand} ${i.name}`).join(` ${t.ui.vs} `)}
      </h1>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {items.map((p) => {
          const o = best(p)
          return (
            <div key={p.slug} className="rounded-2xl border border-border p-3">
              <ProductImage src={p.image} alt={`${p.brand} ${p.name}`} ratio="aspect-[4/3] md:aspect-[16/7]" />
              <div className="mt-3 text-xs text-muted">{p.brand}</div>
              <a href={p.href} className="font-semibold hover:text-accent">{p.name}</a>
              {o && (
                <a href={o.url} rel="sponsored nofollow noopener" target="_blank"
                  className="num mt-3 flex h-10 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-fg">
                  {money(lang, o.price!, o.currency)} · {o.shop}
                </a>
              )}
            </div>
          )
        })}
      </div>

      <section aria-labelledby="choose" className="mt-8 grid gap-3 md:grid-cols-2">
        <h2 id="choose" className="sr-only">{t.ui.verdict}</h2>
        {items.map((p, i) => (
          <div key={p.slug} className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="font-semibold">{fill(t.ui.chooseIf, { name: p.name })}…</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{chooseIf[i]?.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="table" className="mt-10">
        <h2 id="table" className="mb-3 text-xl font-semibold">{t.ui.allSpecs}</h2>
        <CompareTable cols={items.map((p) => ({ name: p.name, brand: p.brand, href: p.href }))} groups={groups}
          labels={{ onlyDiff: t.ui.onlyDiff, better: t.ui.better }} />
      </section>
      <p className="mt-6 text-xs text-muted">{t.ui.source}</p>
    </>
  )
}
