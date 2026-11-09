import 'server-only'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/config'
import { INFO_PAGES, sectionHref } from '@/lib/routes'
import { SITE_URL } from '@/lib/site'
import { db } from '@/lib/supabase'
import { cacheLife } from 'next/cache'
import { getIndexableProducts, getIndexableComparisons, getCategory, getBestSpecs } from '@/lib/catalog'

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

/** Активные категории и их адреса на каждом языке. */
async function categories(): Promise<{ key: string; slugs: Record<string, string> }[]> {
  'use cache'
  cacheLife('hours')
  const s = db()
  if (!s) return []
  const { data } = await s.from('category_i18n').select('lang, slug, categories!inner(key)')
  const m = new Map<string, Record<string, string>>()
  for (const r of data ?? []) {
    const key = (r.categories as unknown as { key: string }).key
    if (!m.has(key)) m.set(key, {})
    m.get(key)![r.lang] = r.slug
  }
  return [...m].map(([key, slugs]) => ({ key, slugs }))
}

export async function listFiles(): Promise<string[]> {
  const files = LOCALES.map((l) => `pages-${l}-1.xml`)
  for (const c of await categories()) {
    const n = Math.ceil((await getIndexableProducts(c.key)).length / PER_FILE)
    for (const l of LOCALES) for (let i = 1; i <= n; i++) if (c.slugs[l]) files.push(`products-${c.key}-${l}-${i}.xml`)
  }
  const nc = Math.ceil((await getIndexableComparisons()).length / PER_FILE)
  for (const l of LOCALES) for (let i = 1; i <= nc; i++) files.push(`comparisons-${l}-${i}.xml`)
  return files
}

export async function entriesFor(file: string): Promise<Entry[] | null> {
  const pm = /^pages-([a-z]{2}(?:-[a-z]{2})?)-1\.xml$/.exec(file)
  if (pm) {
    const lang = pm[1]
    if (!isLocale(lang)) return null
    const cats = (await categories()).filter((c) => c.slugs[lang])
    // страницы «Топ-N по характеристике» для каждой категории + их индекс
    const best: Entry[] = [{ loc: `${SITE_URL}${sectionHref(lang, 'best')}` }]
    for (const c of cats) {
      const cat = await getCategory(lang, c.slugs[lang]!)
      if (!cat) continue
      for (const sp of await getBestSpecs(lang, cat)) best.push({ loc: `${SITE_URL}${sectionHref(lang, 'best', cat.slug, sp.slug)}` })
    }
    return [...staticPages(lang), ...cats.map((c) => ({ loc: `${SITE_URL}/${lang}/${c.slugs[lang]}` })), ...best]
  }
  const cm = /^comparisons-([a-z]{2}(?:-[a-z]{2})?)-(\d+)\.xml$/.exec(file)
  if (cm) {
    const [, lang, n] = cm
    if (!isLocale(lang)) return null
    const part = (await getIndexableComparisons()).slice((Number(n) - 1) * PER_FILE, Number(n) * PER_FILE)
    if (!part.length) return null
    return part.map((c) => ({ loc: `${SITE_URL}${sectionHref(lang, 'compare')}/${c.a}-vs-${c.b}`, lastmod: c.updated.slice(0, 10) }))
  }
  const m = /^products-([a-z0-9-]+?)-([a-z]{2}(?:-[a-z]{2})?)-(\d+)\.xml$/.exec(file)
  if (!m) return null
  const [, key, lang, n] = m
  if (!isLocale(lang)) return null
  const cat = (await categories()).find((c) => c.key === key)
  if (!cat?.slugs[lang]) return null
  const all = await getIndexableProducts(key)
  const part = all.slice((Number(n) - 1) * PER_FILE, Number(n) * PER_FILE)
  if (!part.length) return null
  return part.map((p) => ({ loc: `${SITE_URL}/${lang}/${cat.slugs[lang]}/${p.slug}`, lastmod: p.updated.slice(0, 10) }))
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
