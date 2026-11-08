import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import { Logo } from './Logo'
import { LangSwitcher } from './LangSwitcher'

export function Header({ lang, t }: { lang: Locale; t: Dict }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href={`/${lang}`} className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo className="h-7 w-7" />
          <span>Specvane</span>
        </Link>
        {/* Меню разделов (сравнения, подборки, новинки, гиды) появится на этапе 1, когда у разделов будут страницы —
            ссылки на пустые разделы дали бы 404. */}
        <div className="ml-auto">
          <LangSwitcher lang={lang} label={t.nav.language} />
        </div>
      </div>
    </header>
  )
}
