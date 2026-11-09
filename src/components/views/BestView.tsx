import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { ProductCardData } from '@/lib/types'
import { fill } from '@/lib/format'
import { Breadcrumbs, type Crumb } from '../Breadcrumbs'
import { ProductImage } from '../product/ProductImage'

/** «Топ-N по характеристике»: нумерованный список, значение крупно. Подбор — из наших цифр, без ИИ. */
export function BestView({ t, title, desc, items, crumbs, more }: {
  lang: Locale; t: Dict; title: string; desc: string; items: (ProductCardData & { value: string })[]; crumbs: Crumb[]
  more: { label: string; href: string }[]
}) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{desc}</p>
      <ol className="mt-6 space-y-2">
        {items.map((p, i) => (
          <li key={p.slug}>
            <a href={p.href} className="group flex items-center gap-3 rounded-2xl border border-border p-2 pe-4 transition hover:border-accent/40 hover:shadow-card">
              <span className="num w-10 shrink-0 text-center text-lg font-bold text-muted">{fill(t.ui.bestRank, { n: i + 1 })}</span>
              <ProductImage src={p.image} alt={`${p.brand} ${p.name}`} ratio="aspect-square" className="w-16 shrink-0 sm:w-20" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted">{p.brand}</span>
                <span className="block truncate font-semibold group-hover:text-accent">{p.name}</span>
              </span>
              <span className="num shrink-0 text-lg font-bold">{p.value}</span>
            </a>
          </li>
        ))}
      </ol>
      {more.length > 0 && (
        <nav className="mt-8 flex flex-wrap gap-2" aria-label={t.ui.bestIndexTitle}>
          {more.map((m) => <a key={m.href} href={m.href} className="rounded-full border border-border px-3.5 py-1.5 text-sm hover:border-accent">{m.label}</a>)}
        </nav>
      )}
    </>
  )
}
