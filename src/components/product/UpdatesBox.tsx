import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import { fill } from '@/lib/format'
import type { Support } from '@/lib/updates'

/** «Обновления ПО»: до какого месяца/года модель получает обновления безопасности и системы. */
export function UpdatesBox({ lang, t, brand, s }: { lang: Locale; t: Dict; brand: string; s: Support }) {
  const fmt = (v: string) => (v.length === 4 ? v : new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${v}-01T00:00:00Z`)))
  const end = s.securityUntil ?? s.osUntil
  const endDate = end ? new Date(end.length === 4 ? `${end}-12-31` : `${end}-28`) : null
  const yearsLeft = endDate ? Math.floor((endDate.getTime() - Date.now()) / (365.25 * 86400e3)) : null
  const status = endDate == null ? null : endDate.getTime() < Date.now() ? t.ui.updEnded : yearsLeft! >= 1 ? fill(t.ui.updLeft, { n: yearsLeft! }) : null
  return (
    <section className="rounded-2xl border border-border p-4">
      <h2 className="mb-3 font-semibold">{t.ui.updTitle}</h2>
      <dl className="space-y-2 text-sm">
        {s.securityUntil && (
          <div className="flex items-baseline justify-between gap-3"><dt className="text-muted">{t.ui.updSecurity}</dt><dd className="num font-semibold">{fmt(s.securityUntil)}</dd></div>
        )}
        {(s.osUntil || s.osUpgrades) && (
          <div className="flex items-baseline justify-between gap-3"><dt className="text-muted">{t.ui.updOs}</dt>
            <dd className="num text-end font-semibold">{s.osUntil ? fmt(s.osUntil) : ''}{s.osUpgrades ? <span className="block text-xs font-normal text-muted">{fill(t.ui.updOsCount, { n: s.osUpgrades })}</span> : null}</dd></div>
        )}
      </dl>
      {status && <p className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${endDate!.getTime() < Date.now() ? 'bg-surface-2 text-muted' : 'bg-good-soft text-good'}`}>{status}</p>}
      <p className="mt-3 text-xs text-muted">
        <a href={s.source} target="_blank" rel="nofollow noopener" className="underline hover:text-accent">
          {fill(!s.official ? t.ui.updEstimate : s.press ? t.ui.updPress : t.ui.updOfficial, { brand })}
        </a>
      </p>
    </section>
  )
}
