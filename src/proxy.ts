import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config'

// Роботы никогда не переадресуются по языку браузера — для них «/» всегда ведёт на /en.
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|vkshare|whatsapp|telegram/i

function pickLocale(req: NextRequest): string {
  const ua = req.headers.get('user-agent') ?? ''
  if (BOT.test(ua)) return DEFAULT_LOCALE
  const al = (req.headers.get('accept-language') ?? '').toLowerCase()
  for (const part of al.split(',')) {
    const tag = part.split(';')[0].trim()
    if (!tag) continue
    if (tag.startsWith('pt')) return tag === 'pt-br' || tag === 'pt' ? 'pt-br' : DEFAULT_LOCALE
    let base = tag.split('-')[0]
    if (base === 'no' || base === 'nn') base = 'nb' // норвежский: браузеры шлют no / nb / nn
    if (isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const first = pathname.split('/')[1] ?? ''
  if (isLocale(first)) return NextResponse.next()

  const url = req.nextUrl.clone()
  if (pathname === '/') {
    // Автовыбор языка — только на главной (ТЗ). Временный редирект, чтобы не закреплять выбор в кеше.
    url.pathname = `/${pickLocale(req)}`
    const res = NextResponse.redirect(url, 307)
    res.headers.set('Vary', 'Accept-Language, User-Agent')
    return res
  }
  // Любой другой адрес без языка — постоянный редирект на английскую версию.
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: [
    // всё, кроме служебных файлов, sitemap/robots и файлов с расширением
    '/((?!_next|api|embed/|og/|sitemap\\.xml|sitemaps/|robots\\.txt|favicon\\.ico|icon|apple-icon|.*\\.[a-z0-9]+$).*)',
  ],
}
