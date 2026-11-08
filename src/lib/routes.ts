// Разделы сайта с адресами на языке страны (vergleich, beste, ratgeber…).
// Модели и бренды в адресах не переводятся. Файл без server-only: нужен и переключателю языка.
import { LOCALES, type Locale } from './i18n/config'

export const SECTIONS = ['compare', 'best', 'brands', 'new', 'alternatives', 'guides'] as const
export const INFO_PAGES = ['about', 'how-we-make-money', 'privacy', 'cookies', 'contact', 'legal-notice'] as const
export type Section = (typeof SECTIONS)[number]
export type InfoPage = (typeof INFO_PAGES)[number]
type Key = Section | InfoPage

export const SLUGS: Record<Locale, Record<Key, string>> = {
  en: { compare: 'compare', best: 'best', brands: 'brands', new: 'new', alternatives: 'alternatives', guides: 'guides',
    about: 'about', 'how-we-make-money': 'how-we-make-money', privacy: 'privacy', cookies: 'cookies', contact: 'contact', 'legal-notice': 'legal-notice' },
  de: { compare: 'vergleich', best: 'beste', brands: 'marken', new: 'neu', alternatives: 'alternativen', guides: 'ratgeber',
    about: 'ueber-uns', 'how-we-make-money': 'wie-wir-geld-verdienen', privacy: 'datenschutz', cookies: 'cookies', contact: 'kontakt', 'legal-notice': 'impressum' },
  fr: { compare: 'comparatif', best: 'meilleurs', brands: 'marques', new: 'nouveautes', alternatives: 'alternatives', guides: 'guides-achat',
    about: 'a-propos', 'how-we-make-money': 'comment-nous-gagnons-de-l-argent', privacy: 'confidentialite', cookies: 'cookies', contact: 'contact', 'legal-notice': 'mentions-legales' },
  it: { compare: 'confronto', best: 'migliori', brands: 'marche', new: 'novita', alternatives: 'alternative', guides: 'guide',
    about: 'chi-siamo', 'how-we-make-money': 'come-guadagniamo', privacy: 'privacy', cookies: 'cookie', contact: 'contatti', 'legal-notice': 'note-legali' },
  es: { compare: 'comparativa', best: 'mejores', brands: 'marcas', new: 'novedades', alternatives: 'alternativas', guides: 'guias',
    about: 'sobre-nosotros', 'how-we-make-money': 'como-ganamos-dinero', privacy: 'privacidad', cookies: 'cookies', contact: 'contacto', 'legal-notice': 'aviso-legal' },
  nl: { compare: 'vergelijken', best: 'beste', brands: 'merken', new: 'nieuw', alternatives: 'alternatieven', guides: 'koopgids',
    about: 'over-ons', 'how-we-make-money': 'hoe-we-geld-verdienen', privacy: 'privacy', cookies: 'cookies', contact: 'contact', 'legal-notice': 'colofon' },
  pl: { compare: 'porownanie', best: 'najlepsze', brands: 'marki', new: 'nowosci', alternatives: 'alternatywy', guides: 'poradnik',
    about: 'o-nas', 'how-we-make-money': 'jak-zarabiamy', privacy: 'prywatnosc', cookies: 'cookies', contact: 'kontakt', 'legal-notice': 'nota-prawna' },
  sv: { compare: 'jamforelse', best: 'basta', brands: 'marken', new: 'nyheter', alternatives: 'alternativ', guides: 'kopguide',
    about: 'om-oss', 'how-we-make-money': 'hur-vi-tjanar-pengar', privacy: 'integritet', cookies: 'cookies', contact: 'kontakt', 'legal-notice': 'juridisk-information' },
  'pt-br': { compare: 'comparacao', best: 'melhores', brands: 'marcas', new: 'novidades', alternatives: 'alternativas', guides: 'guias',
    about: 'sobre', 'how-we-make-money': 'como-ganhamos-dinheiro', privacy: 'privacidade', cookies: 'cookies', contact: 'contato', 'legal-notice': 'aviso-legal' },
  ja: { compare: 'compare', best: 'best', brands: 'brands', new: 'new', alternatives: 'alternatives', guides: 'guides',
    about: 'about', 'how-we-make-money': 'how-we-make-money', privacy: 'privacy', cookies: 'cookies', contact: 'contact', 'legal-notice': 'legal-notice' },
}

export function sectionHref(lang: Locale, key: Key, ...rest: string[]): string {
  return ['', lang, SLUGS[lang][key], ...rest].join('/')
}

/** Что за раздел у первого сегмента адреса в этом языке (или null — значит, категория). */
export function resolveSlug(lang: Locale, slug: string): Key | null {
  const map = SLUGS[lang]
  for (const k of Object.keys(map) as Key[]) if (map[k] === slug) return k
  return null
}

/** Тот же раздел на другом языке. Для товаров/категорий нужна база — тогда главная языка. */
export function translatePath(path: string, from: Locale, to: Locale): string {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0 || parts[0] !== from) return `/${to}`
  if (parts.length === 1) return `/${to}`
  const key = resolveSlug(from, parts[1])
  if (key && parts.length === 2) return sectionHref(to, key)
  return `/${to}`
}

export const ALL_LOCALES = LOCALES
