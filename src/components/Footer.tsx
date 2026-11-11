import Link from 'next/link'
import { LOCALES, MARKETS, type Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import { INFO_PAGES, sectionHref } from '@/lib/routes'
import { Logo } from './Logo'
import { legalText } from '@/lib/legal'
import { widgetsText } from '@/lib/widgets'
import { reportText, REPORT_SLUG } from '@/lib/reports'

export function Footer({ lang, t }: { lang: Locale; t: Dict }) {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 font-semibold"><Logo className="h-6 w-6" /> Specvane</div>
          <p className="max-w-sm text-muted">{t.footer.disclosure}</p>
          <p className="mt-3 max-w-sm text-xs text-muted">{legalText(lang).footer}</p>
        </div>
        <nav aria-label="Specvane">
          <ul className="space-y-2">
            {INFO_PAGES.map((p) => (
              <li key={p}><Link href={sectionHref(lang, p)} className="text-muted hover:text-fg">{t.info[p].title}</Link></li>
            ))}
            <li><Link href={sectionHref(lang, 'reports', REPORT_SLUG)} className="text-muted hover:text-fg">{reportText(lang).section}</Link></li>
            <li><Link href={sectionHref(lang, 'widgets')} className="text-muted hover:text-fg">{widgetsText(lang).section}</Link></li>
          </ul>
        </nav>
        <nav id="languages" aria-label={t.nav.language}>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {LOCALES.map((l) => (
              <li key={l}>
                <a href={`/${l}`} hrefLang={MARKETS[l].hreflang} lang={MARKETS[l].hreflang}
                  className={l === lang ? 'font-semibold text-fg' : 'text-muted hover:text-fg'}>{MARKETS[l].nativeName}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted">© Specvane · {t.footer.rights}</p>
      <div className="h-16 md:hidden" aria-hidden="true" />
    </footer>
  )
}
