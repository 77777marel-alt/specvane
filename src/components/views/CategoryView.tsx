import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { ProductCardData } from '@/lib/types'
import { fill } from '@/lib/format'
import { Breadcrumbs, type Crumb } from '../Breadcrumbs'
import { ProductCard } from '../product/ProductCard'

/** Категория: заголовок, фильтры человеческим языком (чипы), сортировка, сетка карточек. */
export function CategoryView({ lang, t, title, intro, items, chips, crumbs, brands }:
  { lang: Locale; t: Dict; title: string; intro?: string; items: ProductCardData[]; chips: string[]; crumbs: Crumb[]; brands?: string[] }) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
        </div>
        <span className="num text-sm text-muted">{fill(t.ui.models, { n: items.length })}</span>
      </div>
      {brands && brands.length > 1 && (
        <nav className="sticky top-0 z-20 -mx-4 mt-5 flex gap-2 no-scrollbar overflow-x-auto border-b border-border/60 bg-bg/90 px-4 py-2 backdrop-blur md:top-16" aria-label={t.ui.filters}>
          {brands.map((b) => (
            <a key={b} href={`#brand-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-sm hover:border-accent">{b}</a>
          ))}
        </nav>
      )}
      {chips.length > 0 && <div className="-mx-4 mt-5 flex gap-2 no-scrollbar overflow-x-auto px-4 pb-1" role="group" aria-label={t.ui.filters}>
        {chips.map((c, i) => (
          <button key={c} type="button" aria-pressed={i === 0}
            className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-sm hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent">
            {c}
          </button>
        ))}
      </div>}
      {brands && brands.length > 1 ? (
        brands.map((b) => (
          <section key={b} id={`brand-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="mt-8 scroll-mt-32">
            <h2 className="mb-3 text-xl font-semibold">{b}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {items.filter((p) => p.brand === b).map((p) => <ProductCard key={p.slug} lang={lang} p={p} />)}
            </div>
          </section>
        ))
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => <ProductCard key={p.slug} lang={lang} p={p} />)}
        </div>
      )}
    </>
  )
}
