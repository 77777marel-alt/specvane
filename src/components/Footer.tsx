import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import { INFO_PAGES, sectionHref } from '@/lib/routes'

export function Footer({ lang, t }: { lang: Locale; t: Dict }) {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <p className="mb-4 text-fg">{t.footer.disclosure}</p>
        <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2">
          {INFO_PAGES.map((p) => (
            <li key={p}>
              <Link href={sectionHref(lang, p)} className="hover:text-fg">{t.info[p].title}</Link>
            </li>
          ))}
        </ul>
        <p>© Specvane · {t.footer.rights}</p>
      </div>
    </footer>
  )
}
