import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { ProductView as P } from '@/lib/types'
import { date } from '@/lib/format'
import { Breadcrumbs, type Crumb } from '../Breadcrumbs'
import { IconChevron } from '../icons'
import { Gallery } from '../product/Gallery'
import { KeySpecs } from '../product/KeySpecs'
import { PriceBox } from '../product/PriceBox'
import { ProsCons } from '../product/ProsCons'
import { PriceHistory } from '../product/PriceHistory'
import { OfferList } from '../product/OfferList'
import { SpecTable } from '../product/SpecTable'
import { ProductCard } from '../product/ProductCard'

/** Страница товара. Верх: фото, название, вердикт, лучшая цена, 3–5 ключевых цифр (ТЗ). */
export function ProductView({ lang, t, p, crumbs, compareLinks, variants, gallery, attribution }:
  { lang: Locale; t: Dict; p: P; crumbs: Crumb[]; compareLinks: { name: string; href: string }[]
    variants?: string[]; gallery?: string[]; attribution?: string }) {
  const keySpecs = p.keySpecs
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <Gallery images={gallery && gallery.length ? gallery : p.image ? [p.image] : []} alt={`${p.brand} ${p.name}`} />
        <div className="space-y-5">
          <div>
            <div className="text-sm text-muted">{p.brand}{p.releaseDate && <> · {t.ui.released} {date(lang, p.releaseDate)}</>}</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{p.brand} {p.name}</h1>
            {p.whoFor && <p className="mt-3 text-lg"><span className="font-semibold">{t.ui.whoFor}:</span> <span className="text-muted">{p.whoFor}</span></p>}
            {variants && variants.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5 text-sm">
                {variants.map((v) => <li key={v} className="num rounded-md border border-border px-2 py-0.5">{v}</li>)}
              </ul>
            )}
          </div>
          <PriceBox lang={lang} t={t} offers={p.offers} />
          <KeySpecs specs={keySpecs} title={t.ui.keySpecs} />
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          {(p.verdict || p.pros.length > 0) && (
            <section aria-labelledby="verdict" className="space-y-3">
              <h2 id="verdict" className="text-xl font-semibold">{t.ui.verdict}</h2>
              {p.verdict && <p className="leading-relaxed">{p.verdict}</p>}
              <ProsCons t={t} pros={p.pros} cons={p.cons} />
            </section>
          )}
          {p.offers.length > 0 && <OfferList lang={lang} t={t} offers={p.offers} />}
          <PriceHistory lang={lang} t={t} points={p.priceHistory} currency={p.currency} />
          <SpecTable groups={p.specGroups} title={t.ui.allSpecs} />
          <p className="text-xs text-muted">{t.ui.source} {t.common.updated}: {date(lang, p.updatedAt)}</p>
          {attribution && <p className="text-xs text-muted">{attribution}</p>}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {compareLinks.length > 0 && (
            <section className="rounded-2xl border border-border p-4">
              <h2 className="mb-2 font-semibold">{t.ui.compareWith}</h2>
              <ul className="space-y-2 text-sm">
                {compareLinks.map((c) => (
                  <li key={c.href}>
                    <a href={c.href} className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 font-medium hover:border-accent hover:text-accent">
                      <span>{c.name}</span><IconChevron className="h-4 w-4 shrink-0 text-muted" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {p.alternatives.length > 0 && (
        <section aria-labelledby="alt" className="mt-12">
          <h2 id="alt" className="mb-4 text-xl font-semibold">{t.ui.alternatives}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {p.alternatives.map((a) => <ProductCard key={a.slug} lang={lang} p={a} />)}
          </div>
        </section>
      )}
    </>
  )
}
