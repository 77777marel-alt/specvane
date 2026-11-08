import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { ProductCardData } from '@/lib/types'
import { money } from '@/lib/format'
import { ProductImage } from './ProductImage'

export function ProductCard({ lang, p }: { lang: Locale; p: ProductCardData }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-border p-3 transition-shadow hover:shadow-card">
      <ProductImage src={p.image} alt={`${p.brand} ${p.name}`} />
      <div className="mt-3 flex-1">
        <div className="text-xs text-muted">{p.brand}</div>
        <h3 className="font-semibold leading-snug"><Link href={p.href} className="after:absolute after:inset-0 group-hover:text-accent" style={{ position: 'static' }}>{p.name}</Link></h3>
        {p.verdict && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.verdict}</p>}
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {p.keySpecs.slice(0, 3).map((s) => (
            <li key={s.key} className="num rounded-md bg-surface px-1.5 py-0.5 text-xs">{s.display}</li>
          ))}
        </ul>
      </div>
      {p.price != null && <div className="num mt-3 text-lg font-bold">{money(lang, p.price, p.currency)}</div>}
    </article>
  )
}
