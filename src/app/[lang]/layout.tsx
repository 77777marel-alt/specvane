import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { LOCALES, MARKETS, isLocale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import '../globals.css'

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
}

export const viewport: Viewport = {
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
    <html lang={MARKETS[lang].hreflang}>
      <body className="min-h-dvh antialiased">
        <Header lang={lang} t={t} />
        <main className="mx-auto max-w-6xl px-4">{children}</main>
        <Footer lang={lang} t={t} />
      </body>
    </html>
  )
}
