import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from './supabase'
import { LOCALES, MARKETS, type Locale } from './i18n/config'
import { getDict } from './i18n'
import { fill, number } from './format'
import { sectionHref } from './routes'
import { GUIDE_CATS } from './guides'
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
  }).sort((a, b) => Number(!a.image) - Number(!b.image)) // модели без фото — в конец списка (порядок внутри сохраняется)
}

/** Предыдущее поколение той же линейки: «Galaxy S24 Ultra» → «Galaxy S23 Ultra», «iPhone 17 Pro» → «iPhone 16 Pro». */
export async function getPrevGeneration(lang: Locale, cat: Category, brand: string, name: string) {
  const m = /^(.*?)(\d{1,4})(\D.*)?$/.exec(name)
  if (!m) return null
  const gen = Number(m[2])
  if (!(gen > 1)) return null
  const target = `${m[1]}${gen - 1}${m[3] ?? ''}`.toLowerCase()
  const all = await getCategoryProducts(lang, cat)
  const prev = all.find((x) => x.brand === brand && x.name.toLowerCase() === target)
  return prev ? getProduct(lang, cat, prev.slug) : null
}

/** Характеристики, по которым есть страницы «Топ-N по …» (числовые, с направлением, данные у ≥30 моделей). */
export async function getBestSpecs(lang: Locale, cat: Category): Promise<{ key: string; label: string; slug: string }[]> {
  const [{ defs }, stats] = await Promise.all([getDefs(cat.id, lang), getSpecStats(cat.id)])
  return defs.filter((d) => d.type === 'number' && d.hib != null && (d.isKey || d.isFilter) && (stats[d.id]?.n ?? 0) >= 30)
    .sort((a, b) => Number(b.isKey) - Number(a.isKey) || a.sort - b.sort).slice(0, 6)
    .map((d) => ({ key: d.key, label: d.label, slug: d.key.replace(/_/g, '-') }))
}

/** Топ-20 моделей категории по характеристике: сначала модели последних 3 лет. */
export async function getBest(lang: Locale, cat: Category, specSlug: string): Promise<{ label: string; total: number; items: (ProductCardData & { value: string })[] } | null> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return null
  const spec = (await getBestSpecs(lang, cat)).find((x) => x.slug === specSlug)
  if (!spec) return null
  const { defs } = await getDefs(cat.id, lang)
  const d = defs.find((x) => x.key === spec.key)!
  const stats = await getSpecStats(cat.id)
  const since = new Date(Date.now() - 3 * 365 * 86400e3).toISOString().slice(0, 10)
  const q = (recent: boolean) => {
    let x = s.from('product_specs').select('value_num, products!inner(slug, name, release_date, status, category_id, brands!inner(name), product_images(url, sort))')
      .eq('spec_id', d.id).eq('products.category_id', cat.id).eq('products.status', 'active').not('value_num', 'is', null)
    if (recent) x = x.gte('products.release_date', since)
    return x.order('value_num', { ascending: !d.hib }).limit(20)
  }
  let { data } = await q(true)
  if (!data || data.length < 10) data = (await q(false)).data
  type R = { value_num: number; products: { slug: string; name: string; release_date: string | null; brands: { name: string }; product_images: { url: string; sort: number }[] } }
  const t = getDict(lang)
  const currency = MARKETS[lang].currency
  const items = ((data ?? []) as unknown as R[]).map((r) => ({
    slug: r.products.slug, href: `/${lang}/${cat.slug}/${r.products.slug}`, name: r.products.name, brand: r.products.brands.name,
    image: [...r.products.product_images].sort((a, b) => a.sort - b.sort)[0]?.url ?? null, price: null, currency, keySpecs: [],
    value: display(lang, d, Number(r.value_num), t.ui.yes, t.ui.no),
  }))
  return { label: spec.label, total: stats[d.id]?.n ?? items.length, items }
}

/** «Похожие, но лучше по X»: для главных характеристик — самая похожая модель (того же времени), которая лучше на ≥10%. */
export async function getBetterAlternatives(lang: Locale, cat: Category, cur: { slug: string; release?: string | null; keySpecs: SpecValue[] }) {
  const all = await getCategoryProducts(lang, cat)
  const me = all.find((x) => x.slug === cur.slug) ?? { ...cur, release: cur.release ?? null }
  const nums = (p: { keySpecs: SpecValue[] }) => Object.fromEntries(p.keySpecs.filter((k) => typeof k.value === 'number' && (k.value as number) > 0).map((k) => [k.key, k.value as number]))
  const mine = nums(me)
  const t0 = me.release ? Date.parse(me.release) : null
  const out: (ProductCardData & { why: string })[] = []
  for (const k of me.keySpecs) {
    if (k.higherIsBetter == null || typeof k.value !== 'number' || !(k.value > 0)) continue
    let best: { p: (typeof all)[number]; d: number; pct: number; disp: string } | null = null
    for (const p of all) {
      if (p.slug === me.slug || out.some((o) => o.slug === p.slug)) continue
      if (t0 && p.release && Math.abs(Date.parse(p.release) - t0) > 400 * 86400e3) continue
      const v = p.keySpecs.find((x) => x.key === k.key)
      if (!v || typeof v.value !== 'number') continue
      const pct = k.higherIsBetter ? (v.value - k.value) / k.value : (k.value - v.value) / k.value
      if (pct < 0.1) continue
      const other = nums(p)
      let d = 0, n = 0
      for (const [key, x] of Object.entries(mine)) if (key !== k.key && other[key]) { d += Math.abs(Math.log(other[key] / x)); n++ }
      if (!n) continue
      d /= n
      if (!best || d < best.d) best = { p, d, pct, disp: v.display }
    }
    if (best && best.d < 0.35) out.push({ ...best.p, why: `${k.label}: ${best.disp} (${k.higherIsBetter ? '+' : '−'}${Math.round(best.pct * 100)}%)` })
    if (out.length >= 4) break
  }
  return out
}

type Stats = { n: number; pct: number[]; hist: number[]; lo: number | null; hi: number | null }
async function getSpecStats(categoryId: number): Promise<Record<number, Stats>> {
  'use cache'
  cacheLife('hours'); cacheTag('stats')
  const s = db()
  if (!s) return {}
  const { data } = await s.from('spec_stats').select('spec_id, n, pct, hist, lo, hi').eq('category_id', categoryId)
  return Object.fromEntries((data ?? []).map((r) => [r.spec_id as number, { n: r.n, pct: r.pct, hist: r.hist, lo: r.lo, hi: r.hi } as Stats]))
}

export type SpecPosition = {
  key: string; label: string; display: string
  /** лучше, чем у N% моделей категории (0..100) */
  better: number
  /** гистограмма значений категории и где на ней эта модель (0..1); по оси — от худшего к лучшему */
  hist: number[]; at: number; n: number
}

/** Положение модели среди всех моделей категории по числовым характеристикам (из нашей статистики, без ИИ). */
export async function getPositions(lang: Locale, cat: Category, specs: SpecValue[], max = 8): Promise<SpecPosition[]> {
  const [{ defs }, stats] = await Promise.all([getDefs(cat.id, lang), getSpecStats(cat.id)])
  const out: (SpecPosition & { isKey: boolean; sort: number })[] = []
  for (const sv of specs) {
    const d = defs.find((x) => x.key === sv.key)
    const st = d && stats[d.id]
    if (!d || !st || d.hib == null || typeof sv.value !== 'number' || st.n < 20) continue
    const v = sv.value
    const below = st.pct.filter((q) => q < v).length, above = st.pct.filter((q) => q > v).length
    const better = Math.round(((d.hib ? below : above) / st.pct.length) * 100)
    const lo = st.lo ?? st.pct[0], hi = st.hi ?? st.pct[st.pct.length - 1]
    let at = hi > lo ? Math.min(1, Math.max(0, (v - lo) / (hi - lo))) : 0.5
    let hist = st.hist
    if (!d.hib) { at = 1 - at; hist = [...hist].reverse() } // ось всегда «хуже → лучше»
    out.push({ key: d.key, label: d.label, display: sv.display, better, hist, at, n: st.n, isKey: d.isKey, sort: d.sort })
  }
  return out.sort((a, b) => Number(b.isKey) - Number(a.isKey) || a.sort - b.sort).slice(0, max)
    .map(({ isKey: _k, sort: _s, ...p }) => p)
}

export async function getProduct(lang: Locale, cat: Category, slug: string): Promise<(ProductView & { images: string[]; docs: { kind: string; url: string }[]; credits: { author: string; license: string; file: string }[]; source: string; variants: { ram: number | null; storage: number | null; colour: string | null }[] }) | null> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return null
  const { data } = await s.from('products')
    .select('id, slug, name, release_date, updated_at, data_source, variants, brands!inner(name), product_images(url, sort, source, source_ref), product_documents(kind, url, lang, title), product_specs(spec_id, value_num, value_bool, value_text)')
    .eq('category_id', cat.id).eq('slug', slug).eq('status', 'active').maybeSingle()
  if (!data) return null
  type Row = { slug: string; name: string; release_date: string | null; updated_at: string; data_source: string; variants: { ram: number | null; storage: number | null; colour: string | null }[]
    brands: { name: string }; product_images: { url: string; sort: number; source?: string; source_ref?: string | null }[]; product_documents?: { kind: string; url: string; lang: string | null; title: string | null }[] | null; product_specs: SpecRow[] }
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
  // документы: на каждый вид — файл на языке страницы, иначе английский, иначе любой
  const ORDER = ['manual', 'energy_label', 'product_fiche', 'brochure']
  const docs = ORDER.flatMap((kind) => {
    const all = (p.product_documents ?? []).filter((d) => d.kind === kind)
    const pick = all.find((d) => d.lang && lang.startsWith(d.lang.slice(0, 2))) ?? all.find((d) => !d.lang || d.lang.startsWith('en')) ?? all[0]
    return pick ? [{ kind, url: pick.url }] : []
  })
  const sortedImgs = [...p.product_images].sort((a, b) => a.sort - b.sort)
  const images = sortedImgs.map((i) => i.url)
  // фото с Wikimedia Commons: «Автор · Лицензия · ссылка на файл» — показываем подпись (условие лицензии)
  const credits = sortedImgs.filter((i) => i.source === 'wikimedia' && i.source_ref).map((i) => {
    const [author, license, file] = i.source_ref!.split(' · ')
    return { author, license, file }
  })

  // альтернативы: ближайшие по дате выхода модели той же категории
  const all = await getCategoryProducts(lang, cat)
  const t0 = p.release_date ? Date.parse(p.release_date) : 0
  const alternatives = all.filter((x) => x.slug !== p.slug)
    .sort((a, b) => Math.abs((a.release ? Date.parse(a.release) : 0) - t0) - Math.abs((b.release ? Date.parse(b.release) : 0) - t0))
    .slice(0, 4)

  return {
    slug: p.slug, href: `/${lang}/${cat.slug}/${p.slug}`, name: p.name, brand: p.brands.name, image: images[0] ?? null, images, credits, docs,
    price: null, currency: MARKETS[lang].currency,
    keySpecs: defs.filter((d) => d.isKey).map((d) => specs.find((x) => x.key === d.key)).filter(Boolean) as SpecValue[],
    category: { name: cat.name, href: `/${lang}/${cat.slug}` },
    releaseDate: p.release_date, whoFor: '', verdict: undefined, pros: [], cons: [],
    specGroups, offers: [], priceHistory: [], updatedAt: p.updated_at, alternatives,
    source: p.data_source, variants: p.variants ?? [],
  }
}

/** Активные модели для sitemap (все языки используют один список). */
/** Сколько моделей категории в sitemap — быстрым count-запросом (для индекса карт, без выгрузки всех адресов). */
export async function countIndexableProducts(categoryKey: string): Promise<number> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return 0
  const { data: c } = await s.from('categories').select('id').eq('key', categoryKey).maybeSingle()
  if (!c) return 0
  const { count } = await s.from('products').select('id', { count: 'exact', head: true }).eq('category_id', c.id)
    .eq('status', 'active').eq('is_indexable', true)
  return count ?? 0
}

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

/** Пары категорий, которые сравнивают между собой (ключи характеристик у них общие). */
const CROSS: [string, string][] = [['smartphones', 'tablets'], ['tablets', 'laptops'], ['monitors', 'tvs']]
export const crossOf = (key: string) => CROSS.flatMap(([a, b]) => (a === key ? [b] : b === key ? [a] : []))

/** «Сравнить с ноутбуком / телевизором…»: по 3 модели из соседней категории — сначала тот же бренд, потом новинки. */
export async function getCrossLinks(lang: Locale, cat: Category, me: { slug: string; brand: string }) {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const out: { cat: string; links: CompareLink[] }[] = []
  for (const key of crossOf(cat.key)) {
    const s = db(); if (!s) break
    const { data } = await s.from('categories').select('id').eq('key', key).maybeSingle()
    const other = data ? await categoryById(lang, data.id) : null
    if (!other) continue
    const all = await getCategoryProducts(lang, other)
    const pick = [...all.filter((p) => p.brand === me.brand), ...all.filter((p) => p.brand !== me.brand)].slice(0, 3)
    if (pick.length) out.push({ cat: other.name, links: pick.map((p) => ({ name: `${p.brand} ${p.name}`, href: compareHref(lang, ...([me.slug, p.slug].sort((u, v) => u.localeCompare(v)) as [string, string])) })) })
  }
  return out
}

/** Пара по адресу «a-vs-b». Возвращает обе модели и канонический порядок (как в базе). */
export async function getComparison(lang: Locale, pairSlug: string) {
  'use cache'
  cacheLife('hours'); cacheTag('comparisons')
  const s = db()
  if (!s) return null
  const parts = pairSlug.split('-vs-')
  // 3–4 модели: «a-vs-b-vs-c» — собирается посетителем, в индекс не идёт (только пары)
  if (parts.length >= 3 && parts.length <= 4 && new Set(parts).size === parts.length) {
    const { data } = await s.from('products').select('id, slug, category_id').in('slug', parts).eq('status', 'active')
    if (data && data.length === parts.length && data.every((d) => d.category_id === data[0].category_id)) {
      const cat = await categoryById(lang, data[0].category_id)
      if (!cat) return null
      const items = await Promise.all(parts.map((sl) => getProduct(lang, cat, sl)))
      if (items.some((x) => !x)) return null
      return { cat, items: items as NonNullable<(typeof items)[number]>[], known: false, canonical: `${sectionHref(lang, 'compare')}/${parts.join('-vs-')}` }
    }
  }
  for (let i = 1; i < parts.length; i++) {
    const a = parts.slice(0, i).join('-vs-'), b = parts.slice(i).join('-vs-')
    const { data } = await s.from('products').select('id, slug, category_id').in('slug', [a, b]).eq('status', 'active')
    if (!data || data.length !== 2) continue
    if (data[0].category_id !== data[1].category_id) {
      // между категориями (планшет против ноутбука и т. п.): только общие характеристики
      const [ca, cb] = await Promise.all(data.map((d) => categoryById(lang, d.category_id)))
      if (!ca || !cb || !crossOf(ca.key).includes(cb.key)) continue
      const [x, y] = await Promise.all([getProduct(lang, ca, data[0].slug), getProduct(lang, cb, data[1].slug)])
      if (!x || !y) return null
      const keys = (p: typeof x) => new Set(p.specGroups.flatMap((g) => g.specs).map((v) => v.key))
      const kx = keys(x), ky = keys(y)
      const only = (p: typeof x, other: Set<string>) => ({ ...p, specGroups: p.specGroups.map((g) => ({ ...g, specs: g.specs.filter((v) => other.has(v.key)) })).filter((g) => g.specs.length) })
      const first = data[0].slug === a
      const items = first ? [only(x, ky), only(y, kx)] : [only(y, kx), only(x, ky)]
      const [pa, pb] = [...data].sort((u, v) => u.slug.localeCompare(v.slug))
      return { cat: first ? ca : cb, cats: first ? [ca, cb] : [cb, ca], items, cross: true,
        known: x.brand === y.brand && kx.size > 0 && items[0].specGroups.length > 0, canonical: compareHref(lang, pa.slug, pb.slug) }
    }
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
/** Пары для sitemap: не все 65 тыс., а самые осмысленные (по relevance) — равномерно по категориям, чтобы бюджет обхода Google
 *  шёл на модели и разделы. Остальные пары доступны на сайте по ссылкам. Основные категории — до 300 пар, прочие — до 40. */
export async function getIndexableComparisons(): Promise<{ a: string; b: string; updated: string }[]> {
  'use cache'
  cacheLife('hours'); cacheTag('comparisons')
  const s = db()
  if (!s) return []
  const { data: cats } = await s.from('categories').select('id, key')
  const keyOf = new Map((cats ?? []).map((c) => [c.id as number, c.key as string]))
  const by = new Map<number, { a: string; b: string; updated: string; rel: number }[]>()
  for (let from = 0; ; from += 1000) {
    const { data } = await s.from('comparisons').select('updated_at, relevance, category_id, a:products!comparisons_product_a_fkey(slug), b:products!comparisons_product_b_fkey(slug)')
      .eq('is_indexable', true).order('id').range(from, from + 999)
    type R = { updated_at: string; relevance: number | null; category_id: number; a: { slug: string }; b: { slug: string } }
    // модель могла уйти из каталога (скрыта RLS) — такую пару пропускаем
    for (const r of (data ?? []) as unknown as R[]) {
      if (!r.a || !r.b) continue
      const l = by.get(r.category_id) ?? []
      l.push({ a: r.a.slug, b: r.b.slug, updated: r.updated_at, rel: Number(r.relevance ?? 0) }); by.set(r.category_id, l)
    }
    if (!data || data.length < 1000) break
  }
  const out: { a: string; b: string; updated: string }[] = []
  for (const [cid, l] of by) {
    const cap = GUIDE_CATS.includes(keyOf.get(cid) ?? '') ? 300 : 40
    out.push(...l.sort((x, y) => y.rel - x.rel).slice(0, cap).map(({ a, b, updated }) => ({ a, b, updated })))
  }
  return out
}

/** Хронология категории: медиана характеристики у моделей каждого года выпуска (только из наших данных). */
export async function getTrends(lang: Locale, cat: Category) {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const [items, filters] = await Promise.all([getCategoryProducts(lang, cat), getFilterDefs(lang, cat)])
  const out: { key: string; label: string; hib: boolean; years: { year: number; n: number; v: number; d: string }[] }[] = []
  for (const f of filters) {
    if (f.type !== 'number' || f.hib == null) continue
    const by = new Map<number, { v: number; d: string }[]>()
    for (const it of items) {
      const x = it.facets?.[f.key]; const y = it.release ? Number(it.release.slice(0, 4)) : NaN
      if (!x || typeof x.v !== 'number' || !(x.v > 0) || !(y >= 2010)) continue
      by.set(y, [...(by.get(y) ?? []), { v: x.v, d: x.d }])
    }
    const years = [...by.entries()].filter(([, l]) => l.length >= 5).sort((a, b) => a[0] - b[0]).slice(-6)
      .map(([year, l]) => { const s = [...l].sort((a, b) => a.v - b.v); const m = s[Math.floor((s.length - 1) / 2)]; return { year, n: l.length, v: m.v, d: m.d } })
    if (years.length >= 3 && years.at(-1)!.v !== years[0].v) out.push({ key: f.key, label: f.label, hib: f.hib, years })
  }
  return out.sort((a, b) => b.years.reduce((s, y) => s + y.n, 0) - a.years.reduce((s, y) => s + y.n, 0)).slice(0, 4)
}

const TOP_BRANDS = new Set(['Apple', 'Samsung', 'Google', 'Xiaomi', 'Sony', 'OnePlus', 'Lenovo', 'Dell', 'HP', 'ASUS', 'Bose', 'LG'])
/** Бренды, по которым чаще всего ищут сравнения: их пары и модели поднимаем на главной. */
const POPULAR_BRANDS = new Set(['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus', 'Sony', 'LG', 'Lenovo', 'HP', 'Dell', 'ASUS', 'Acer', 'Microsoft',
  'Huawei', 'Honor', 'Motorola', 'Nothing', 'Bose', 'JBL', 'Garmin', 'Philips', 'TCL', 'Hisense', 'MSI', 'Oppo', 'vivo', 'realme', 'Sennheiser', 'Amazfit'])

/**
 * Главная: по популярным категориям — новинки с фото, самые «искомые» пары сравнения
 * (известные бренды, свежие модели) и ссылки на топы по характеристикам. Всё — внутренние ссылки для людей и Google.
 */
export async function getHomeShowcase(lang: Locale) {
  'use cache'
  cacheLife('hours'); cacheTag('products'); cacheTag('comparisons')
  const s = db()
  if (!s) return []
  const t = getDict(lang)
  const keys = ['smartphones', 'laptops', 'tablets', 'headphones', 'tvs', 'smartwatches']
  const { data: rows } = await s.from('categories').select('id, key').in('key', keys).eq('is_active', true)
  const since = Date.now() - 548 * 86400e3 // ~18 месяцев
  const out = []
  for (const key of keys) {
    const row = (rows ?? []).find((r) => r.key === key)
    if (!row) continue
    const cat = await categoryById(lang, row.id)
    if (!cat) continue
    const all = await getCategoryProducts(lang, cat)
    const withImg = all.filter((p) => p.image)
    // новинки: свежие модели с фото, известные бренды вперёд, не больше 2 моделей одного бренда
    const perBrand = new Map<string, number>()
    const known = (p: (typeof all)[number]) => (TOP_BRANDS.has(p.brand) ? 2 : POPULAR_BRANDS.has(p.brand) ? 1 : 0) - (p.name.length > 28 ? 1 : 0)
    const fresh = [...withImg].sort((a, b) => known(b) - known(a)
      || String(b.release ?? '').localeCompare(String(a.release ?? '')))
      .filter((p) => { const n = perBrand.get(p.brand) ?? 0; if (n >= 2) return false; perBrand.set(p.brand, n + 1); return true })
      .slice(0, 4)
    // пары: из готовых сравнений категории — известные бренды и свежие модели выше
    const bySlug = new Map(all.map((p) => [p.slug, p]))
    const { data: pairs } = await s.from('comparisons')
      .select('relevance, a:products!comparisons_product_a_fkey!inner(slug, category_id), b:products!comparisons_product_b_fkey!inner(slug)')
      .eq('a.category_id', cat.id).order('relevance', { ascending: false }).limit(1000)
    type Pr = { relevance: number; a: { slug: string }; b: { slug: string } }
    // известность модели: топ-бренд, свежесть, фото, короткое «человеческое» имя (без артикулов вроде 16-ap1504na)
    const score = (x: (typeof all)[number]) => (TOP_BRANDS.has(x.brand) ? 3 : POPULAR_BRANDS.has(x.brand) ? 2 : 0)
      + (x.release && Date.parse(x.release) > since ? 1 : 0) + (x.image ? 1 : -3)
      - (x.name.length > 28 ? 2 : 0) - (/\d{2,}-\w*\d|\s-\s|\b[A-Z0-9]{8,}\b/.test(x.name) ? 3 : 0)
    // пара: разные бренды интереснее; варианты одной модели (5G / Wi-Fi) — неинтересны
    const base = (n: string) => n.replace(/\s+(5G|4G|LTE|Wi-?Fi|Cellular)\b.*$/i, '').trim()
    const pairScore = (a: (typeof all)[number], b: (typeof all)[number]) => score(a) + score(b)
      + (a.brand !== b.brand ? 2 : 0) - (base(a.name) === base(b.name) ? 6 : 0)
    const seen = new Set<string>()
    const compares = ((pairs ?? []) as unknown as Pr[])
      .map((r) => ({ a: bySlug.get(r.a.slug), b: bySlug.get(r.b.slug) }))
      .filter((r): r is { a: (typeof all)[number]; b: (typeof all)[number] } => !!r.a && !!r.b)
      .sort((x, y) => pairScore(y.a, y.b) - pairScore(x.a, x.b))
      .filter((r) => { const k = r.a.slug, m = r.b.slug; if (seen.has(k) || seen.has(m)) return false; seen.add(k); seen.add(m); return true })
      .slice(0, 4)
      .map((r) => ({ name: `${r.a.brand} ${r.a.name} vs ${r.b.brand} ${r.b.name}`, href: compareHref(lang, r.a.slug, r.b.slug) }))
    const best = (await getBestSpecs(lang, cat)).slice(0, 3)
      .map((x) => ({ name: fill(t.ui.bestTitle, { category: cat.name, n: 20, spec: x.label }), href: sectionHref(lang, 'best', cat.slug, x.slug) }))
    out.push({ key, name: cat.name, href: `/${lang}/${cat.slug}`, fresh, compares, best })
  }
  return out
}

/** Категория по ключу (smartphones, dishwashers…) на нужном языке. */
export async function getCategoryByKey(lang: Locale, key: string): Promise<Category | null> {
  'use cache'
  cacheLife('hours'); cacheTag('categories')
  const s = db()
  if (!s) return null
  const { data } = await s.from('categories').select('id').eq('key', key).maybeSingle()
  return data ? categoryById(lang, data.id) : null
}

/** Словарь: ссылки термина на категории и «топ-20 по характеристике» (только если такая страница есть). */
export async function getGlossaryLinks(lang: Locale, specs: { cat: string; key?: string }[]): Promise<{ name: string; href: string }[]> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const t = getDict(lang)
  const out: { name: string; href: string }[] = []
  for (const sp of specs) {
    const cat = await getCategoryByKey(lang, sp.cat)
    if (!cat) continue
    const best = sp.key ? (await getBestSpecs(lang, cat)).find((x) => x.key === sp.key) : undefined
    if (best) out.push({ name: fill(t.ui.bestTitle, { category: cat.name, n: 20, spec: best.label }), href: sectionHref(lang, 'best', cat.slug, best.slug) })
    else if (!out.some((x) => x.href === `/${lang}/${cat.slug}`)) out.push({ name: cat.name, href: `/${lang}/${cat.slug}` })
  }
  return out
}

// ---------- бренды категории: «Бренд A или бренд B» (таблицы brand_stats / brand_spec_stats, миграция 0012) ----------
export type BrandRow = { id: number; slug: string; name: string; n: number; recent: number; newest: string | null }

/** Бренды категории с ≥5 моделями — по числу моделей. */
export async function getCategoryBrands(cat: Category): Promise<BrandRow[]> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return []
  const { data } = await s.from('brand_stats').select('n, n_recent, newest, brands!inner(id, slug, name)').eq('category_id', cat.id).order('n', { ascending: false }).limit(60)
  type R = { n: number; n_recent: number; newest: string | null; brands: { id: number; slug: string; name: string } }
  return ((data ?? []) as unknown as R[]).map((r) => ({ id: r.brands.id, slug: r.brands.slug, name: r.brands.name, n: r.n, recent: r.n_recent, newest: r.newest }))
}

/** Популярные пары брендов категории (топ-5 по числу моделей) — для ссылок и sitemap. */
export async function getBrandPairs(lang: Locale, cat: Category, top = 5): Promise<{ a: BrandRow; b: BrandRow; href: string }[]> {
  const list = (await getCategoryBrands(cat)).slice(0, top)
  const out: { a: BrandRow; b: BrandRow; href: string }[] = []
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const [a, b] = [list[i], list[j]].sort((x, y) => x.slug.localeCompare(y.slug))
    out.push({ a, b, href: sectionHref(lang, 'brands', cat.slug, `${a.slug}-vs-${b.slug}`) })
  }
  return out
}

export type BrandVsRow = { key: string; label: string; a: { med: string; top: string } | null; b: { med: string; top: string } | null; win: 'a' | 'b' | null }
/** Сравнение двух брендов по медиане и лучшим 10 % моделей. */
export async function getBrandVs(lang: Locale, cat: Category, aSlug: string, bSlug: string) {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return null
  const brands = await getCategoryBrands(cat)
  const a = brands.find((x) => x.slug === aSlug), b = brands.find((x) => x.slug === bSlug)
  if (!a || !b) return null
  const [{ defs }, st] = await Promise.all([getDefs(cat.id, lang), s.from('brand_spec_stats').select('brand_id, spec_id, n, med, top').eq('category_id', cat.id).in('brand_id', [a.id, b.id])])
  type R = { brand_id: number; spec_id: number; n: number; med: number; top: number }
  const rows = (st.data ?? []) as R[]
  const t = getDict(lang)
  const fmt = (d: Def, v: number) => display(lang, d, Math.round(v * 100) / 100, t.ui.yes, t.ui.no)
  const out: BrandVsRow[] = []
  let wa = 0, wb = 0
  for (const d of defs.filter((x) => x.type === 'number' && x.hib != null).sort((x, y) => Number(y.isKey) - Number(x.isKey) || x.sort - y.sort)) {
    const ra = rows.find((r) => r.brand_id === a.id && r.spec_id === d.id), rb = rows.find((r) => r.brand_id === b.id && r.spec_id === d.id)
    if (!ra && !rb) continue
    let win: 'a' | 'b' | null = null
    if (ra && rb) {
      const diff = (ra.med - rb.med) / Math.max(Math.abs(ra.med), Math.abs(rb.med), 1e-9)
      if (Math.abs(diff) >= 0.03) win = (diff > 0) === d.hib ? 'a' : 'b'
      if (win === 'a') wa++; else if (win === 'b') wb++
    }
    out.push({ key: d.key, label: d.label, a: ra ? { med: fmt(d, ra.med), top: fmt(d, ra.top) } : null, b: rb ? { med: fmt(d, rb.med), top: fmt(d, rb.top) } : null, win })
    if (out.length >= 14) break
  }
  const both = out.filter((r) => r.a && r.b).length
  const all = await getCategoryProducts(lang, cat)
  return { a, b, rows: out, both, wa, wb, latestA: all.filter((p) => p.brand === a.name).slice(0, 4), latestB: all.filter((p) => p.brand === b.name).slice(0, 4) }
}

/** «Сегодня» для расчётов на странице (сколько лет обновлений осталось): кешируется на сутки, чтобы не вызывать Date.now() при пререндере. */
export async function todayMs(): Promise<number> {
  'use cache'
  cacheLife('days')
  return Date.now()
}

// ---------- подборки «смартфоны с NFC», «посудомоечные машины до 45 см» (из фильтров категории, без новых запросов к базе) ----------
export type ListDef = { slug: string; kind: 'with' | 'min' | 'max'; key: string; label: string; value?: number; valueText?: string; n: number }
const NICE = [1, 1.2, 1.4, 1.5, 1.6, 2, 2.5, 3, 4, 5, 6, 7, 8, 10]
const nice = (x: number) => { const p = 10 ** Math.floor(Math.log10(Math.abs(x) || 1)); const m = x / p; return NICE.reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a)) * p }

/** Подборки категории: да/нет-признаки (которые есть у 5–90 % моделей) и пороги по числам (≈ медиана и 80-й перцентиль, «красиво» округлённые). */
export async function getLists(lang: Locale, cat: Category): Promise<ListDef[]> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const [defsAll, items] = await Promise.all([getDefs(cat.id, lang), getCategoryProducts(lang, cat)])
  const defs = defsAll.defs.filter((d) => d.isFilter)
  const total = items.length
  if (total < 20) return []
  const t = getDict(lang)
  const out: ListDef[] = []
  for (const d of defs) {
    const vals = items.map((p) => p.facets?.[d.key]?.v).filter((v) => v != null)
    if (d.type === 'bool') {
      const n = vals.filter((v) => v === true).length
      if (n >= 10 && n <= total * 0.9) out.push({ slug: `with-${d.key.replace(/_/g, '-')}`, kind: 'with', key: d.key, label: d.label, n })
    } else if (d.type === 'number' && d.hib != null) {
      const nums = (vals as number[]).filter((v) => typeof v === 'number').sort((a, b) => a - b)
      if (nums.length < 30) continue
      const seen = new Set<number>()
      for (const q of [0.5, 0.8]) {
        const raw = d.hib ? nums[Math.floor(nums.length * q)] : nums[Math.floor(nums.length * (1 - q))]
        const v = Math.round(nice(raw) * 100) / 100
        if (seen.has(v) || !(v > 0)) continue
        seen.add(v)
        const n = nums.filter((x) => (d.hib ? x >= v : x <= v)).length
        if (n < 10 || n > total * 0.95) continue
        const kind = d.hib ? 'min' : 'max'
        out.push({ slug: `${d.key.replace(/_/g, '-')}-${kind}-${String(v).replace('.', '-')}`, kind, key: d.key, label: d.label, value: v, valueText: display(lang, d, v, t.ui.yes, t.ui.no), n })
      }
    }
  }
  return out.sort((a, b) => b.n - a.n).slice(0, 40)
}

/** Модели подборки (сначала новые и с фото). */
export async function getListItems(lang: Locale, cat: Category, slug: string) {
  const def = (await getLists(lang, cat)).find((x) => x.slug === slug)
  if (!def) return null
  const items = (await getCategoryProducts(lang, cat)).filter((p) => {
    const v = p.facets?.[def.key]?.v
    return def.kind === 'with' ? v === true : typeof v === 'number' && (def.kind === 'min' ? v >= def.value! : v <= def.value!)
  })
  return { def, items }
}

// ---------- «Лучшие в 2026» по общей оценке: средневзвешенный перцентиль по важным характеристикам ----------
const DIMS = ['width', 'height', 'depth', 'depth_mm', 'thickness', 'height_adjust']
const PORTABLE = ['smartphones', 'tablets', 'laptops', 'headphones', 'smartwatches', 'cameras', 'power-banks', 'speakers']
export type OverallItem = ProductCardData & { score: number; strengths: { label: string; p: number }[] }

/** Значения числовых характеристик всех активных моделей категории (общие для всех языков, кеш на час). */
async function getSpecValues(categoryId: number, specIds: number[]): Promise<Record<string, Record<number, number | boolean>>> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  const out: Record<string, Record<number, number | boolean>> = {}
  if (!s) return out
  for (let page = 0; page < 20; page++) {
    const { data } = await s.from('product_specs').select('spec_id, value_num, value_bool, products!inner(slug, category_id, status)')
      .eq('products.category_id', categoryId).eq('products.status', 'active').in('spec_id', specIds).or('value_num.not.is.null,value_bool.not.is.null')
      .order('product_id').order('spec_id').range(page * 1000, page * 1000 + 999)
    const rows = (data ?? []) as unknown as { spec_id: number; value_num: number | null; value_bool: boolean | null; products: { slug: string } }[]
    for (const r of rows) (out[r.products.slug] ??= {})[r.spec_id] = r.value_num != null ? Number(r.value_num) : !!r.value_bool
    if (rows.length < 1000) break
  }
  return out
}

export async function getOverall(lang: Locale, cat: Category, limit = 20): Promise<OverallItem[]> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return []
  const [{ defs }, stats, items] = await Promise.all([getDefs(cat.id, lang), getSpecStats(cat.id), getCategoryProducts(lang, cat)])
  // все числовые характеристики с направлением «больше/меньше — лучше» и статистикой; без габаритов; вес — только у переносной техники
  const scored = defs.filter((d) => d.type === 'number' && d.hib != null && (stats[d.id]?.n ?? 0) >= 30
    && !DIMS.includes(d.key) && (!/^weight/.test(d.key) || PORTABLE.includes(cat.key)))
    .sort((a, b) => Number(b.isKey) - Number(a.isKey) || Number(b.isFilter) - Number(a.isFilter) || a.sort - b.sort).slice(0, 8)
  if (scored.length < 3) return []
  // значения характеристик, которых нет в карточках списка, — отдельным запросом (страницами по 1000)
  const extra = scored.filter((d) => !d.isFilter)
  const vals = extra.length ? await getSpecValues(cat.id, extra.map((d) => d.id)) : {}
  const valueOf = (p: ProductCardData, d: Def) => { const v = p.facets?.[d.key]?.v; if (typeof v === 'number') return v; const w = vals[p.slug]?.[d.id]; return typeof w === 'number' ? w : undefined }
  const W = (d: Def) => (d.isKey ? 2 : 1), total = scored.reduce((a, d) => a + W(d), 0)
  // «лучше, чем у p %»: средний ранг среди равных (иначе у 8 ГБ ОЗУ или 120 Гц все получают «лучше 90 %»), от 1 до 99
  const below = (pct: number[], v: number) => { let lo = 0, hi = pct.length; while (lo < hi) { const m = (lo + hi) >> 1; if (pct[m] < v) lo = m + 1; else hi = m } return lo }
  const upto = (pct: number[], v: number) => { let lo = 0, hi = pct.length; while (lo < hi) { const m = (lo + hi) >> 1; if (pct[m] <= v) lo = m + 1; else hi = m } return lo }
  const rank = (pct: number[], v: number) => { const a = below(pct, v), b = upto(pct, v), n = pct.length - 1; return Math.min(99, Math.max(1, Math.round(((a + b) / 2 - 0.5) / n * 100))) }
  const since = new Date(Date.now() - 2 * 365 * 86400e3).toISOString().slice(0, 10)
  const recent = items.filter((p) => p.release && p.release >= since)
  const pool = recent.length >= 30 ? recent : items.slice(0, 600)
  const out: OverallItem[] = []
  for (const p of pool) {
    let sum = 0, w = 0
    const parts: { label: string; p: number }[] = []
    for (const d of scored) {
      const v = valueOf(p, d)
      if (typeof v !== 'number') continue
      const r = rank(stats[d.id].pct, v), q = d.hib ? r : 100 - r
      sum += q * W(d); w += W(d); parts.push({ label: d.label, p: q })
    }
    if (w < total * 0.6) continue
    out.push({ ...p, score: Math.round(sum / w), strengths: parts.sort((a, b) => b.p - a.p).slice(0, 3) })
  }
  // один представитель на модель: убираем варианты с тем же названием до объёма памяти/цвета
  const base = (s: string) => s.toLowerCase().replace(/\b\d+\s?(gb|tb)\b.*$/i, '').replace(/[\s-]+/g, ' ').trim()
  const seen = new Set<string>()
  return out.sort((a, b) => b.score - a.score).filter((x) => { const k = `${x.brand} ${base(x.name)}`; if (seen.has(k)) return false; seen.add(k); return true }).slice(0, limit)
}

// ---------- подборки «для кого» (data/usecases/defs.json): ноутбуки для студентов, тихие стиральные машины… ----------
import USECASES from '../../data/usecases/defs.json'
type UseRule = { key: string; op: 'gte' | 'lte' | 'is' | 'match'; value: number | boolean | string; show?: string }
export type UseCase = { slug: string; cat: string; rules: UseRule[]; sort: { key: string; dir: 'asc' | 'desc' } }
export type UseCaseResult = { uc: UseCase; criteria: { label: string; text: string }[]; items: ProductCardData[] }

/** Модели, подходящие под правила подборки; правила по характеристикам, которых нет в базе категории, — подборка не строится. */
export async function getUseCases(lang: Locale, cat: Category): Promise<UseCaseResult[]> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const ucs = (USECASES as UseCase[]).filter((u) => u.cat === cat.key)
  if (!ucs.length) return []
  const [{ defs }, items] = await Promise.all([getDefs(cat.id, lang), getCategoryProducts(lang, cat)])
  const byKey = new Map(defs.map((d) => [d.key, d]))
  const need = [...new Set(ucs.flatMap((u) => [...u.rules.map((r) => r.key), u.sort.key]))].map((k) => byKey.get(k)).filter((d): d is Def => !!d && !d.isFilter)
  const vals = need.length ? await getSpecValues(cat.id, need.map((d) => d.id)) : {}
  const t = getDict(lang)
  const valueOf = (p: ProductCardData, d: Def) => { const f = p.facets?.[d.key]?.v; return f != null ? f : vals[p.slug]?.[d.id] }
  const out: UseCaseResult[] = []
  for (const uc of ucs) {
    const rdefs = uc.rules.map((r) => byKey.get(r.key))
    if (rdefs.some((d) => !d)) continue
    const ok = (p: ProductCardData) => uc.rules.every((r, i) => {
      const v = valueOf(p, rdefs[i]!)
      if (v == null) return false
      if (r.op === 'is') return v === r.value
      if (r.op === 'match') return typeof v === 'string' && new RegExp(String(r.value), 'i').test(v)
      return typeof v === 'number' && (r.op === 'gte' ? v >= Number(r.value) : v <= Number(r.value))
    })
    const sd = byKey.get(uc.sort.key)
    const sortV = (p: ProductCardData) => { const v = sd ? valueOf(p, sd) : null; return typeof v === 'number' ? v : null }
    const list = items.filter(ok).sort((a, b) => {
      const va = sortV(a), vb = sortV(b)
      if (va == null || vb == null) return va == null ? 1 : -1
      return uc.sort.dir === 'asc' ? va - vb : vb - va
    })
    const criteria = uc.rules.map((r, i) => {
      const d = rdefs[i]!
      const sign = r.op === 'gte' ? '≥ ' : r.op === 'lte' ? '≤ ' : ''
      const text = r.op === 'is' ? (r.value ? t.ui.yes : t.ui.no) : r.op === 'match' ? (r.show ?? String(r.value)) : sign + display(lang, d, Number(r.value), t.ui.yes, t.ui.no)
      return { label: d.label, text }
    })
    out.push({ uc, criteria, items: list })
  }
  return out
}

// ---------- «Реальный размер»: габариты моделей для сравнения в натуральную величину ----------
export type SizeItem = { s: string; n: string; img: string | null; w: number; h: number; d: number | null; dg: number | null; ap: boolean }
const SIZE_CATS = ['smartphones', 'tablets', 'smartwatches', 'tvs', 'monitors'] as const

/** Ширина × высота × толщина (мм). Нет опубликованных габаритов — оценка по диагонали (флаг ap). */
export async function getSizeData(lang: Locale, catKey: string): Promise<SizeItem[]> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  if (!(SIZE_CATS as readonly string[]).includes(catKey)) return []
  const cat = await getCategoryByKey(lang, catKey)
  if (!cat) return []
  const [{ defs }, items] = await Promise.all([getDefs(cat.id, lang), getCategoryProducts(lang, cat)])
  const byKey = new Map(defs.map((d) => [d.key, d]))
  const want = ['width', 'height', 'thickness', 'depth_mm', 'case_size', 'display_size'].map((k) => byKey.get(k)).filter((d): d is Def => !!d)
  const vals = await getSpecValues(cat.id, want.filter((d) => !d.isFilter).map((d) => d.id))
  const num = (p: ProductCardData, key: string) => {
    const d = byKey.get(key); if (!d) return null
    const f = p.facets?.[key]?.v; const v = typeof f === 'number' ? f : vals[p.slug]?.[d.id]
    return typeof v === 'number' && v > 0 ? v : null
  }
  const out: SizeItem[] = []
  for (const p of items) {
    const dg = num(p, 'display_size')
    let w = num(p, 'width'), h = num(p, 'height'), ap = false
    const d = num(p, 'thickness') ?? num(p, 'depth_mm')
    if (catKey === 'smartwatches') {
      const cs = num(p, 'case_size')
      if (!w || !h) { if (!cs) continue; h = cs; w = Math.round(cs * 0.86 * 10) / 10; ap = true }
    } else if (!w || !h) {
      if (!dg) continue
      // оценка: экран 20:9 (телефоны), 16:10 (планшеты), 16:9 (ТВ) + рамки
      // мониторы: соотношение сторон из характеристики (21:9, 16:10, 32:9…), рамка ~15 мм
      const ar = catKey === 'monitors' ? /(\d+(?:[.,]\d+)?)\s*:\s*(\d+(?:[.,]\d+)?)/.exec(String(p.facets?.aspect_ratio?.v ?? '')) : null
      const [ax, ay, bx, by] = catKey === 'smartphones' ? [9, 20, 7, 12] : catKey === 'tablets' ? [10, 16, 16, 16]
        : catKey === 'monitors' ? [ar ? Number(ar[1].replace(',', '.')) : 16, ar ? Number(ar[2].replace(',', '.')) : 9, 15, 15] : [16, 9, 20, 20]
      const diag = dg * 25.4, k = diag / Math.hypot(ax, ay)
      w = Math.round(ax * k + bx); h = Math.round(ay * k + by); ap = true
    }
    if ((catKey === 'tvs' || catKey === 'monitors') && w < h) [w, h] = [h, w]
    if (catKey !== 'tvs' && catKey !== 'monitors' && w > h) [w, h] = [h, w] // телефоны и планшеты — вертикально
    out.push({ s: p.slug, n: `${p.brand} ${p.name}`, img: p.image ?? null, w, h, d, dg, ap })
    if (out.length >= 1500) break
  }
  return out
}
