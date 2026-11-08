import 'server-only'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/config'
import { INFO_PAGES, sectionHref } from '@/lib/routes'
import { SITE_URL } from '@/lib/site'

// Индекс + отдельные файлы по языку и типу: pages-de-1.xml, products-de-1.xml…
// В файлах только адреса и lastmod, без alternates (hreflang — в <head> страниц).
export const PER_FILE = 10_000
export type SitemapType = 'pages' | 'products' | 'comparisons' | 'collections'

type Entry = { loc: string; lastmod?: string }

/** Страницы, которые индексируем на этапе 0: главные языков + «о нас», «как зарабатываем», «контакты». */
function staticPages(lang: Locale): Entry[] {
  const indexable = INFO_PAGES.filter((p) => p === 'about' || p === 'how-we-make-money' || p === 'contact')
  return [{ loc: `${SITE_URL}/${lang}` }, ...indexable.map((p) => ({ loc: SITE_URL + sectionHref(lang, p) }))]
}

export async function listFiles(): Promise<string[]> {
  // Этап 1+: добавить products/comparisons/collections с подсчётом страниц из базы (is_indexable).
  return LOCALES.map((l) => `pages-${l}-1.xml`)
}

export async function entriesFor(file: string): Promise<Entry[] | null> {
  const m = /^(pages|products|comparisons|collections)-([a-z]{2}(?:-[a-z]{2})?)-(\d+)\.xml$/.exec(file)
  if (!m) return null
  const [, type, lang, n] = m
  if (!isLocale(lang)) return null
  if (type === 'pages') return Number(n) === 1 ? staticPages(lang) : null
  return null
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function urlsetXml(entries: Entry[]): string {
  const body = entries
    .map((e) => `<url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export function indexXml(files: string[]): string {
  const body = files.map((f) => `<sitemap><loc>${SITE_URL}/sitemaps/${f}</loc></sitemap>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`
}
