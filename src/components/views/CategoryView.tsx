import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { ProductCardData } from '@/lib/types'
import { fill } from '@/lib/format'
import { Breadcrumbs, type Crumb } from '../Breadcrumbs'
import { ProductCard } from '../product/ProductCard'
import { CategoryBrowser } from './CategoryBrowser'

/** Категория: заголовок, фильтры человеческим языком (чипы), сортировка, сетка карточек. */
export function CategoryView({ lang, t, title, intro, items, crumbs, brands, browser }:
  { lang: Locale; t: Dict; title: string; intro?: string; items: ProductCardData[]; chips?: string[]; crumbs: Crumb[]; brands?: string[]
    browser?: { filters: { key: string; label: string; type: string; hib: boolean | null }[]; compare: { cat: string; base: string } } }) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
        </div>
        {!browser && <span className="num text-sm text-muted">{fill(t.ui.models, { n: items.length })}</span>}
      </div>
      {browser ? (
        <CategoryBrowser lang={lang} items={items} filters={browser.filters} brands={brands ?? []} compare={browser.compare}
          s={{ ...t.ui, models: t.ui.models }} />
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => <ProductCard key={p.slug} lang={lang} p={p} />)}
        </div>
      )}
    </>
  )
}
