import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { ProductCardData } from '@/lib/types'
import { fill } from '@/lib/format'
import { Breadcrumbs, type Crumb } from '../Breadcrumbs'
import { ProductCard } from '../product/ProductCard'

/** Категория: заголовок, фильтры человеческим языком (чипы), сортировка, сетка карточек. */
export function CategoryView({ lang, t, title, intro, items, chips, crumbs }:
  { lang: Locale; t: Dict; title: string; intro?: string; items: ProductCardData[]; chips: string[]; crumbs: Crumb[] }) {
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
      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label={t.ui.filters}>
        {chips.map((c, i) => (
          <button key={c} type="button" aria-pressed={i === 0}
            className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-sm hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent">
            {c}
          </button>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => <ProductCard key={p.slug} lang={lang} p={p} />)}
      </div>
    </>
  )
}
