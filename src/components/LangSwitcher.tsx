'use client'
import { usePathname } from 'next/navigation'
import { LOCALES, MARKETS, type Locale } from '@/lib/i18n/config'
import { translatePath } from '@/lib/routes'

export function LangSwitcher({ lang, label }: { lang: Locale; label: string }) {
  const path = usePathname() ?? `/${lang}`
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-md border border-border px-2.5 py-1.5 text-sm">
        <span className="sr-only">{label}: </span>
        {MARKETS[lang].nativeName}
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-border bg-bg p-1 shadow-lg">
        {LOCALES.map((l) => (
          <li key={l}>
            <a
              href={translatePath(path, lang, l)}
              hrefLang={MARKETS[l].hreflang}
              lang={MARKETS[l].hreflang}
              aria-current={l === lang ? 'true' : undefined}
              className="block rounded-md px-3 py-2 text-sm hover:bg-surface aria-[current]:font-semibold"
            >
              {MARKETS[l].nativeName}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
