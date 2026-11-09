import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from './supabase'
import { LOCALES, MARKETS, type Locale } from './i18n/config'
import { getDict } from './i18n'
import { number } from './format'
import { sectionHref } from './routes'
import type { ProductCardData, ProductView, SpecGroup, SpecValue } from './types'

// Каталог из Supabase. Все функции кешируются (каталог меняется ночным импортом).
// Данные Icecat здесь только показываются — в генеративный ИИ они не передаются (лицензия OCL §10).

export type Category = { id: number; key: string; slug: string; name: string; slugs: Partial<Record<Locale, string>> }
type Def = { id: number; key: string; group: string; type: string; unit: string | null; hib: boolean | null; isKey: boolean; isFilter: boolean; sort: number; label: string }

export async function getCategory(lang: Locale, slug: string): Promise<Category | null> {
  'use cache'
  cacheLife('hours'); cacheTag('categories')
  const s = db()
  if (!s) return null
  const { data } = await s.from('category_i18n').select('category_id, slug, name, categories!inner(key)').eq('lang', lang).eq('slug', slug).maybeSingle()
  if (!data) return null
  const all = await s.from('category_i18n').select('lang, slug').eq('category_id', data.category_id)
  const slugs = Object.fromEntries((all.data ?? []).filter((r) => (LOCALES as readonly string[]).includes(r.lang)).map((r) => [r.lang, r.slug]))
  return { id: data.category_id, key: (data.categories as unknown as { key: string }).key, slug: data.slug, name: data.name, slugs }
}

async function getDefs(categoryId: number, lang: Locale): Promise<{ defs: Def[]; groups: Record<string, string> }> {
  'use cache'
  cacheLife('hours'); cacheTag('specs')
  const s = db()!
  const [d, g] = await Promise.all([
    s.from('spec_definitions').select('id, key, group_key, data_type, unit, higher_is_better, is_key_spec, is_filter, sort, spec_definition_i18n(lang, label)').eq('category_id', categoryId).order('sort'),
    s.from('spec_group_i18n').select('group_key, label').eq('lang', lang),
  ])
  type Row = { id: number; key: string; group_key: string; data_type: string; unit: string | null; higher_is_better: boolean | null; is_key_spec: boolean; is_filter: boolean; sort: number; spec_definition_i18n: { lang: string; label: string }[] }
  const defs = ((d.data ?? []) as Row[]).map((r) => ({
    id: r.id, key: r.key, group: r.group_key, type: r.data_type, unit: r.unit, hib: r.higher_is_better, isKey: r.is_key_spec, isFilter: r.is_filter, sort: r.sort,
    label: r.spec_definition_i18n.find((x) => x.lang === lang)?.label ?? r.spec_definition_i18n.find((x) => x.lang === 'en')?.label ?? r.key,
  }))
  return { defs, groups: Object.fromEntries((g.data ?? []).map((r) => [r.group_key, r.label])) }
}

const YEARS: Partial<Record<Locale, string>> = { en: 'years', de: 'Jahre', fr: 'ans', it: 'anni', es: 'años', nl: 'jaar', pl: 'lat', sv: 'år', 'pt-br': 'anos', ja: '年' }

function display(lang: Locale, def: Def, v: number | boolean | string, yes: string, no: string): string {
  if (typeof v === 'boolean') return v ? yes : no
  if (typeof v === 'string') return v
  const n = number(lang, v, v < 10 && def.unit !== 'GB' ? (def.unit === 'kg' ? 2 : 1) : 0)
  switch (def.unit) {
    case 'in': return `${n}″`
    case '×': return `${n}×`
    case 'years': return `${n} ${YEARS[lang] ?? 'years'}`
    case null: return n
    default: return `${n} ${def.unit}`
  }
}

type SpecRow = { value_num: number | null; value_bool: boolean | null; value_text: string | null; spec_id: number }
function specValues(lang: Locale, defs: Def[], rows: SpecRow[]): SpecValue[] {
  const t = getDict(lang)
  const byId = new Map(rows.map((r) => [r.spec_id, r]))
  const out: SpecValue[] = []
  for (const d of defs) {
    const r = byId.get(d.id)
    if (!r) continue
    const v = r.value_num ?? r.value_bool ?? r.value_text
    if (v == null) continue
    out.push({ key: d.key, label: d.label, value: v, display: display(lang, d, v, t.ui.yes, t.ui.no), higherIsBetter: d.hib })
  }
  return out
}

/** Главные характеристики для карточки: смартфоны — проверенный набор, остальные — is_key_spec из базы. */
const PHONE_CARD_KEYS = ['display_size', 'chipset', 'ram', 'main_camera', 'battery']
const cardKeys = (defs: Def[]) => {
  const keys = defs.filter((d) => d.isKey).map((d) => d.key)
  return PHONE_CARD_KEYS.every((k) => keys.includes(k)) ? PHONE_CARD_KEYS : keys
}

export type FilterDef = { key: string; label: string; type: string; hib: boolean | null }
/** Характеристики-фильтры категории (для панели фильтров). */
export async function getFilterDefs(lang: Locale, cat: Category): Promise<FilterDef[]> {
  const { defs } = await getDefs(cat.id, lang)
  return defs.filter((d) => d.isFilter).map((d) => ({ key: d.key, label: d.label, type: d.type, hib: d.hib }))
}

/** Все активные модели категории (для списка, альтернатив и sitemap). */
export async function getCategoryProducts(lang: Locale, cat: Category): Promise<(ProductCardData & { release: string | null })[]> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return []
  const { defs } = await getDefs(cat.id, lang)
  const CARD_KEYS = cardKeys(defs)
  const cardDefs = defs.filter((d) => CARD_KEYS.includes(d.key) || d.isFilter)
  const { data } = await s.from('products')
    .select('slug, name, release_date, brands!inner(name), product_images(url, sort), product_specs(spec_id, value_num, value_bool, value_text)')
    .eq('category_id', cat.id).eq('status', 'active')
    .in('product_specs.spec_id', cardDefs.map((d) => d.id))
    .order('release_date', { ascending: false, nullsFirst: false })
    .limit(2000)
  type Row = { slug: string; name: string; release_date: string | null; brands: { name: string }; product_images: { url: string; sort: number }[]; product_specs: SpecRow[] }
  const currency = MARKETS[lang].currency
  return ((data ?? []) as unknown as Row[]).map((p) => {
    const specs = specValues(lang, cardDefs, p.product_specs)
    return {
      slug: p.slug, href: `/${lang}/${cat.slug}/${p.slug}`, name: p.name, brand: p.brands.name,
      image: [...p.product_images].sort((a, b) => a.sort - b.sort)[0]?.url ?? null,
      price: null, currency, release: p.release_date,
      keySpecs: CARD_KEYS.map((k) => specs.find((x) => x.key === k)).filter(Boolean) as SpecValue[],
      facets: Object.fromEntries(specs.filter((x) => defs.find((d) => d.key === x.key)?.isFilter).map((x) => [x.key, { v: x.value, d: x.display }])),
    }
  })
}

export async function getProduct(lang: Locale, cat: Category, slug: string): Promise<(ProductView & { images: string[]; source: string; variants: { ram: number | null; storage: number | null; colour: string | null }[] }) | null> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return null
  const { data } = await s.from('products')
    .select('id, slug, name, release_date, updated_at, data_source, variants, brands!inner(name), product_images(url, sort), product_specs(spec_id, value_num, value_bool, value_text)')
    .eq('category_id', cat.id).eq('slug', slug).eq('status', 'active').maybeSingle()
  if (!data) return null
  type Row = { slug: string; name: string; release_date: string | null; updated_at: string; data_source: string; variants: { ram: number | null; storage: number | null; colour: string | null }[]
    brands: { name: string }; product_images: { url: string; sort: number }[]; product_specs: SpecRow[] }
  const p = data as unknown as Row
  const { defs, groups } = await getDefs(cat.id, lang)
  const specs = specValues(lang, defs, p.product_specs)
  const specGroups: SpecGroup[] = []
  for (const d of defs) {
    const v = specs.find((x) => x.key === d.key)
    if (!v) continue
    let g = specGroups.find((x) => x.name === (groups[d.group] ?? d.group))
    if (!g) specGroups.push((g = { name: groups[d.group] ?? d.group, specs: [] }))
    g.specs.push(v)
  }
  const images = [...p.product_images].sort((a, b) => a.sort - b.sort).map((i) => i.url)

  // альтернативы: ближайшие по дате выхода модели той же категории
  const all = await getCategoryProducts(lang, cat)
  const t0 = p.release_date ? Date.parse(p.release_date) : 0
  const alternatives = all.filter((x) => x.slug !== p.slug)
    .sort((a, b) => Math.abs((a.release ? Date.parse(a.release) : 0) - t0) - Math.abs((b.release ? Date.parse(b.release) : 0) - t0))
    .slice(0, 4)

  return {
    slug: p.slug, href: `/${lang}/${cat.slug}/${p.slug}`, name: p.name, brand: p.brands.name, image: images[0] ?? null, images,
    price: null, currency: MARKETS[lang].currency,
    keySpecs: defs.filter((d) => d.isKey).map((d) => specs.find((x) => x.key === d.key)).filter(Boolean) as SpecValue[],
    category: { name: cat.name, href: `/${lang}/${cat.slug}` },
    releaseDate: p.release_date, whoFor: '', verdict: undefined, pros: [], cons: [],
    specGroups, offers: [], priceHistory: [], updatedAt: p.updated_at, alternatives,
    source: p.data_source, variants: p.variants ?? [],
  }
}

/** Активные модели для sitemap (все языки используют один список). */
export async function getIndexableProducts(categoryKey: string): Promise<{ slug: string; updated: string }[]> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return []
  const out: { slug: string; updated: string }[] = []
  for (let from = 0; ; from += 1000) {
    const { data } = await s.from('products').select('slug, updated_at, categories!inner(key)').eq('categories.key', categoryKey)
      .eq('status', 'active').eq('is_indexable', true).order('id').range(from, from + 999)
    out.push(...(data ?? []).map((r) => ({ slug: r.slug, updated: r.updated_at })))
    if (!data || data.length < 1000) break
  }
  return out
}

// ---------- сравнения ----------

export type CompareLink = { name: string; href: string }

async function categoryById(lang: Locale, id: number): Promise<Category | null> {
  'use cache'
  cacheLife('hours'); cacheTag('categories')
  const s = db()
  if (!s) return null
  const { data } = await s.from('category_i18n').select('slug').eq('category_id', id).eq('lang', lang).maybeSingle()
  return data ? getCategory(lang, data.slug) : null
}

/** Ссылки «Сравнить с…» для страницы модели. */
export async function getCompareLinks(lang: Locale, productSlug: string, limit = 8): Promise<CompareLink[]> {
  'use cache'
  cacheLife('hours'); cacheTag('comparisons')
  const s = db()
  if (!s) return []
  const { data: p } = await s.from('products').select('id').eq('slug', productSlug).maybeSingle()
  if (!p) return []
  const { data } = await s.from('comparisons')
    .select('relevance, a:products!comparisons_product_a_fkey(slug, name, brands(name)), b:products!comparisons_product_b_fkey(slug, name, brands(name))')
    .or(`product_a.eq.${p.id},product_b.eq.${p.id}`).order('relevance', { ascending: false }).limit(limit)
  type Side = { slug: string; name: string; brands: { name: string } }
  return ((data ?? []) as unknown as { a: Side; b: Side }[]).filter((r) => r.a && r.b).map(({ a, b }) => ({
    name: `${a.brands.name} ${a.name} vs ${b.brands.name} ${b.name}`,
    href: compareHref(lang, a.slug, b.slug),
  }))
}

export function compareHref(lang: Locale, a: string, b: string) {
  return `${sectionHref(lang, 'compare')}/${a}-vs-${b}`
}

/** Пара по адресу «a-vs-b». Возвращает обе модели и канонический порядок (как в базе). */
export async function getComparison(lang: Locale, pairSlug: string) {
  'use cache'
  cacheLife('hours'); cacheTag('comparisons')
  const s = db()
  if (!s) return null
  const parts = pairSlug.split('-vs-')
  for (let i = 1; i < parts.length; i++) {
    const a = parts.slice(0, i).join('-vs-'), b = parts.slice(i).join('-vs-')
    const { data } = await s.from('products').select('id, slug, category_id').in('slug', [a, b]).eq('status', 'active')
    if (!data || data.length !== 2 || data[0].category_id !== data[1].category_id) continue
    const [pa, pb] = data[0].id < data[1].id ? data : [data[1], data[0]]
    const { data: c } = await s.from('comparisons').select('id').eq('product_a', pa.id).eq('product_b', pb.id).maybeSingle()
    const cat = await categoryById(lang, pa.category_id)
    if (!cat) return null
    const [x, y] = await Promise.all([getProduct(lang, cat, pa.slug), getProduct(lang, cat, pb.slug)])
    if (!x || !y) return null
    // порядок как в адресе (первая — та, что указана первой), канонический — как в базе
    const ordered = a === pa.slug ? [x, y] : [y, x]
    return { cat, items: ordered, known: !!c, canonical: compareHref(lang, pa.slug, pb.slug) }
  }
  return null
}

/** Популярные сравнения (для раздела «Сравнения»). */
export async function getTopComparisons(lang: Locale, limit = 60): Promise<CompareLink[]> {
  'use cache'
  cacheLife('hours'); cacheTag('comparisons')
  const s = db()
  if (!s) return []
  const { data } = await s.from('comparisons')
    .select('a:products!comparisons_product_a_fkey(slug, name, release_date, brands(name)), b:products!comparisons_product_b_fkey(slug, name, brands(name))')
    .order('relevance', { ascending: false }).limit(limit * 3)
  type Side = { slug: string; name: string; release_date?: string; brands: { name: string } }
  return ((data ?? []) as unknown as { a: Side; b: Side }[])
    .filter((r) => r.a && r.b)
    .sort((x, y) => String(y.a.release_date).localeCompare(String(x.a.release_date)))
    .slice(0, limit)
    .map(({ a, b }) => ({ name: `${a.brands.name} ${a.name} vs ${b.brands.name} ${b.name}`, href: compareHref(lang, a.slug, b.slug) }))
}

/** Все открытые пары (для sitemap). */
export async function getIndexableComparisons(): Promise<{ a: string; b: string; updated: string }[]> {
  'use cache'
  cacheLife('hours'); cacheTag('comparisons')
  const s = db()
  if (!s) return []
  const out: { a: string; b: string; updated: string }[] = []
  for (let from = 0; ; from += 1000) {
    const { data } = await s.from('comparisons').select('updated_at, a:products!comparisons_product_a_fkey(slug), b:products!comparisons_product_b_fkey(slug)')
      .order('id').range(from, from + 999)
    type R = { updated_at: string; a: { slug: string }; b: { slug: string } }
    // модель могла уйти из каталога (скрыта RLS) — такую пару пропускаем
    out.push(...((data ?? []) as unknown as R[]).filter((r) => r.a && r.b).map((r) => ({ a: r.a.slug, b: r.b.slug, updated: r.updated_at })))
    if (!data || data.length < 1000) break
  }
  return out
}
