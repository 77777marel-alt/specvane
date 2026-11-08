import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, MARKETS, isLocale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { BottomNav } from '@/components/BottomNav'
import { sectionHref } from '@/lib/routes'
import { themeScript } from '@/components/theme-script'
import '../globals.css'

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0f13' },
  ],
}

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = getDict(lang)
  return (
    <html lang={MARKETS[lang].hreflang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh overflow-x-clip antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-bg focus:px-3 focus:py-2">Skip to content</a>
        <Header lang={lang} t={t} />
        <main id="main" className="mx-auto max-w-6xl px-4">{children}</main>
        <Footer lang={lang} t={t} />
        <BottomNav
          searchLabel={t.ui.searchLabel}
          left={[{ href: `/${lang}`, label: t.ui.home, icon: 'home' }, { href: `/${lang}#categories`, label: t.ui.categories, icon: 'grid' }]}
          right={[{ href: sectionHref(lang, 'compare'), label: t.nav.compare, icon: 'compare' }, { href: '#languages', label: t.nav.language, icon: 'globe' }]}
        />
      </body>
    </html>
  )
}
