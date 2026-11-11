import 'server-only'
import { LOCALES, isLocale, type Locale } from '@/lib/i18n/config'
import { INFO_PAGES, sectionHref } from '@/lib/routes'
import { SITE_URL } from '@/lib/site'
import { db } from '@/lib/supabase'
import { cacheLife } from 'next/cache'
import { getIndexableProducts, countIndexableProducts, getIndexableComparisons, getCategory, getBestSpecs, getCategoryByKey, getBrandPairs, getLists, getUseCases } from '@/lib/catalog'
import { APPLIANCES, applianceName, isThinCode, errorBrands, errorCodes, hasErrors, type Appliance } from '@/lib/errors'
import { TOOLS } from '@/lib/tools'
import { GLOSSARY_SLUGS } from '@/lib/glossary'
import { GUIDE_CATS } from '@/lib/guides'

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
  // индекс должен отдаваться быстро: только count-запросы, параллельно
  const cats = await categories()
  const counts = await Promise.all(cats.map((c) => countIndexableProducts(c.key)))
  cats.forEach((c, k) => {
    const n = Math.ceil(counts[k] / PER_FILE)
    for (const l of LOCALES) for (let i = 1; i <= n; i++) if (c.slugs[l]) files.push(`products-${c.key}-${l}-${i}.xml`)
  })
  // сравнений в карте ≤ 300 × основные + 40 × прочие категории (< 10 000) — один файл на язык
  const nc = 1
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
    // все категории параллельно (последовательно sitemap не укладывается в 60 с)
    const parts = await Promise.all(cats.map(async (c) => {
      const out: Entry[] = []
      const cat = await getCategory(lang, c.slugs[lang]!)
      if (!cat) return out
      // рейтинг «Лучшие в 2026» — только основные категории (без расчёта здесь: sitemap должен собираться быстро)
      if (GUIDE_CATS.includes(cat.key)) out.push({ loc: `${SITE_URL}${sectionHref(lang, 'best', cat.slug)}` })
      for (const sp of await getBestSpecs(lang, cat)) out.push({ loc: `${SITE_URL}${sectionHref(lang, 'best', cat.slug, sp.slug)}` })
      // сравнения брендов и подборки: только основные категории (с гидами)
      if (GUIDE_CATS.includes(cat.key)) {
        const [pairs, lists, ucs] = await Promise.all([getBrandPairs(lang, cat, 6), getLists(lang, cat), getUseCases(lang, cat)])
        for (const u of ucs) if (u.items.length >= 10) out.push({ loc: `${SITE_URL}${sectionHref(lang, 'lists', cat.slug, u.uc.slug)}` })
        if (pairs.length) out.push({ loc: `${SITE_URL}${sectionHref(lang, 'brands', cat.slug)}` }, ...pairs.map((x) => ({ loc: `${SITE_URL}${x.href}` })))
        if (lists.length || ucs.length) out.push({ loc: `${SITE_URL}${sectionHref(lang, 'lists', cat.slug)}` }, ...lists.map((x) => ({ loc: `${SITE_URL}${sectionHref(lang, 'lists', cat.slug, x.slug)}` })))
      }
      return out
    }))
    best.push(...parts.flat())
    // коды ошибок техники — только на языках с переводом
    const errors: Entry[] = []
    if (hasErrors(lang)) {
      errors.push({ loc: `${SITE_URL}${sectionHref(lang, 'errors')}` })
      for (const a of Object.keys(APPLIANCES) as Appliance[]) {
        const seg = (await getCategoryByKey(lang, a))?.slug ?? applianceName(lang, a).slug
        for (const b of errorBrands(a)) {
          errors.push({ loc: `${SITE_URL}${sectionHref(lang, 'errors', seg, b.slug)}` })
          for (const c of errorCodes(lang, a, b.slug)) if (!isThinCode(a, c.brand, c.code)) errors.push({ loc: `${SITE_URL}${sectionHref(lang, 'errors', seg, b.slug, c.slug)}` })
        }
      }
    }
    const tools: Entry[] = [{ loc: `${SITE_URL}${sectionHref(lang, 'tools')}` }, ...TOOLS.map((x) => ({ loc: `${SITE_URL}${sectionHref(lang, 'tools', x.id)}` }))]
    const gloss: Entry[] = [{ loc: `${SITE_URL}${sectionHref(lang, 'reports', 'tech-trends-2026')}` }, { loc: `${SITE_URL}${sectionHref(lang, 'widgets')}` }, { loc: `${SITE_URL}${sectionHref(lang, 'glossary')}` }, ...GLOSSARY_SLUGS.map((g) => ({ loc: `${SITE_URL}${sectionHref(lang, 'glossary', g)}` }))]
    const guidesE: Entry[] = [{ loc: `${SITE_URL}${sectionHref(lang, 'guides')}` }]
    for (const c of GUIDE_CATS) guidesE.push({ loc: `${SITE_URL}${sectionHref(lang, 'guides', (await getCategoryByKey(lang, c))?.slug ?? (c in APPLIANCES ? applianceName(lang, c as Appliance).slug : c))}` })
    return [...staticPages(lang), ...guidesE, ...cats.map((c) => ({ loc: `${SITE_URL}/${lang}/${c.slugs[lang]}` })), ...best, ...errors, ...tools, ...gloss]
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
