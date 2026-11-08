import type { Metadata } from 'next'
import { LOCALES, MARKETS, type Locale } from './i18n/config'
import { SITE_URL } from './site'

/**
 * hreflang в <head>: все языки + x-default (английский).
 * pathFor(lang) возвращает адрес этой же страницы на языке lang или null, если её там нет
 * (например, товар не продаётся в стране) — тогда язык не указываем.
 */
export function alternates(current: Locale, pathFor: (l: Locale) => string | null): Metadata['alternates'] {
  const languages: Record<string, string> = {}
  for (const l of LOCALES) {
    const p = pathFor(l)
    if (p) languages[MARKETS[l].hreflang] = SITE_URL + p
  }
  const en = pathFor('en')
  if (en) languages['x-default'] = SITE_URL + en
  const self = pathFor(current)
  return { canonical: self ? SITE_URL + self : undefined, languages }
}
