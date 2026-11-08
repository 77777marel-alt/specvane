import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { ProductCardData } from '@/lib/types'
import { money } from '@/lib/format'
import { ProductImage } from './ProductImage'

/** Карточка товара: вся карточка — одна ссылка (фото, название, характеристики). */
export function ProductCard({ lang, p }: { lang: Locale; p: ProductCardData }) {
  return (
    <article className="group h-full">
      <Link href={p.href} className="flex h-full flex-col rounded-2xl border border-border p-3 transition hover:border-accent/40 hover:shadow-card focus-visible:outline-2 focus-visible:outline-accent">
        <ProductImage src={p.image} alt={`${p.brand} ${p.name}`} className="transition-transform group-hover:scale-[1.02]" />
        <div className="mt-3 flex-1">
          <div className="text-xs text-muted">{p.brand}</div>
          <h3 className="font-semibold leading-snug group-hover:text-accent">{p.name}</h3>
          {p.verdict && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.verdict}</p>}
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {p.keySpecs.slice(0, 3).map((s) => (
              <li key={s.key} className="num rounded-md bg-surface px-1.5 py-0.5 text-xs">{s.display}</li>
            ))}
          </ul>
        </div>
        {p.price != null && <div className="num mt-3 text-lg font-bold">{money(lang, p.price, p.currency)}</div>}
      </Link>
    </article>
  )
}
