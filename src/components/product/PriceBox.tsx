import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { Offer } from '@/lib/types'
import { date, fill, money } from '@/lib/format'
import { IconExternal } from '../icons'

/** Лучшая цена страны + кнопка «Купить». Порядок — по цене, не по комиссии (ТЗ). */
export function PriceBox({ lang, t, offers }: { lang: Locale; t: Dict; offers: Offer[] }) {
  const best = offers.filter((o) => o.inStock && o.price != null).sort((a, b) => a.price! - b.price!)[0] ?? offers[0]
  if (!best) return null
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted">{t.ui.bestPrice}</div>
          <div className="num text-3xl font-bold tracking-tight">{best.price != null ? money(lang, best.price, best.currency) : '—'}</div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${best.inStock ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'}`}>
          {best.inStock ? t.ui.inStock : t.ui.outOfStock}
        </span>
      </div>
      <a href={best.url} rel="sponsored nofollow noopener" target="_blank"
        className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-fg hover:opacity-90">
        {best.price != null ? fill(t.ui.buyAt, { shop: best.shop }) : t.ui.checkPrice}
        <IconExternal className="h-4 w-4" />
      </a>
      <p className="mt-2 text-xs text-muted">{fill(t.ui.priceUpdated, { date: date(lang, best.updatedAt) })} · {t.footer.disclosure}</p>
    </div>
  )
}
