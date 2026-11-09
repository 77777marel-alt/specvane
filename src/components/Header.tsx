import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import { Logo } from './Logo'
import { sectionHref } from '@/lib/routes'
import { LangSwitcher } from './LangSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { SearchBox } from './SearchBox'

export function Header({ lang, t }: { lang: Locale; t: Dict }) {
  return (
    <header className="z-30 border-b md:sticky md:top-0 border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href={`/${lang}`} className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <Logo className="h-8 w-8" />
          <span className="text-[17px]">Specvane</span>
        </Link>
        <nav aria-label={t.nav.menu} className="hidden shrink-0 gap-4 text-sm text-muted lg:flex">
          <Link href={`/${lang}#categories`} className="hover:text-fg">{t.nav.categories}</Link>
          <Link href={sectionHref(lang, 'compare')} className="hover:text-fg">{t.nav.compare}</Link>
        </nav>
        <div className="mx-auto hidden w-full max-w-md md:block">
          <SearchBox lang={lang} placeholder={t.ui.searchPlaceholder} label={t.ui.searchLabel} empty={t.ui.noResults} />
        </div>
        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <ThemeToggle labels={{ theme: t.ui.theme, light: t.ui.themeLight, dark: t.ui.themeDark, system: t.ui.themeSystem }} />
          <div className="hidden md:block"><LangSwitcher lang={lang} label={t.nav.language} /></div>
        </div>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <SearchBox lang={lang} placeholder={t.ui.searchPlaceholder} label={t.ui.searchLabel} empty={t.ui.noResults} />
      </div>
    </header>
  )
}
