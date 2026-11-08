import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { Offer } from '@/lib/types'
import { money } from '@/lib/format'
import { IconChevron } from '../icons'

export function OfferList({ lang, t, offers }: { lang: Locale; t: Dict; offers: Offer[] }) {
  const sorted = [...offers].sort((a, b) => Number(b.inStock) - Number(a.inStock) || (a.price ?? 1e12) - (b.price ?? 1e12))
  return (
    <section aria-labelledby="shops" className="space-y-3">
      <h2 id="shops" className="text-xl font-semibold">{t.ui.shops}</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {sorted.map((o, i) => (
          <li key={o.shop}>
            <a href={o.url} rel="sponsored nofollow noopener" target="_blank" className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{o.shop}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className={o.inStock ? 'text-good' : 'text-muted'}>{o.inStock ? t.ui.inStock : t.ui.outOfStock}</span>
                  {i === 0 && o.inStock && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">{t.ui.bestPrice}</span>}
                </span>
              </span>
              <span className="num shrink-0 whitespace-nowrap text-right text-base font-semibold">{o.price != null ? money(lang, o.price, o.currency) : '—'}</span>
              <IconChevron className="h-4 w-4 text-muted" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
