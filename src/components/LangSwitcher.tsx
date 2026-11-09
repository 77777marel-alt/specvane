'use client'
import { usePathname } from 'next/navigation'
import { LOCALES, MARKETS, type Locale } from '@/lib/i18n/config'
import { translatePath } from '@/lib/routes'
import { IconGlobe } from './icons'

export function LangSwitcher({ lang, label }: { lang: Locale; label: string }) {
  const path = usePathname() ?? `/${lang}`
  return (
    <details className="relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm text-muted hover:text-fg">
        <IconGlobe className="h-4 w-4" />
        <span className="sr-only">{label}: </span>
        {MARKETS[lang].nativeName}
      </summary>
      <ul className="absolute end-0 z-40 mt-2 w-56 rounded-xl border border-border bg-bg p-1 shadow-card">
        {LOCALES.map((l) => (
          <li key={l}>
            <a href={translatePath(path, lang, l)} hrefLang={MARKETS[l].hreflang} lang={MARKETS[l].hreflang}
              aria-current={l === lang ? 'true' : undefined}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-surface aria-[current]:font-semibold aria-[current]:text-accent">
              {MARKETS[l].nativeName}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}
