import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from './supabase'
import { LOCALES, MARKETS, type Locale } from './i18n/config'
import { getDict } from './i18n'
import { fill, number } from './format'
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

export async function getProduct(lang: Locale, cat: Category, slug: string): Promise<(ProductView & { images: string[]; credits: { author: string; license: string; file: string }[]; source: string; variants: { ram: number | null; storage: number | null; colour: string | null }[] }) | null> {
  'use cache'
  cacheLife('hours'); cacheTag('products')
  const s = db()
  if (!s) return null
  const { data } = await s.from('products')
    .select('id, slug, name, release_date, updated_at, data_source, variants, brands!inner(name), product_images(url, sort, source, source_ref), product_specs(spec_id, value_num, value_bool, value_text)')
    .eq('category_id', cat.id).eq('slug', slug).eq('status', 'active').maybeSingle()
  if (!data) return null
  type Row = { slug: string; name: string; release_date: string | null; updated_at: string; data_source: string; variants: { ram: number | null; storage: number | null; colour: string | null }[]
    brands: { name: string }; product_images: { url: string; sort: number; source?: string; source_ref?: string | null }[]; product_specs: SpecRow[] }
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
    slug: p.slug, href: `/${lang}/${cat.slug}/${p.slug}`, name: p.name, brand: p.brands.name, image: images[0] ?? null, images, credits,
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
    const fresh = [...withImg].sort((a, b) => Number(POPULAR_BRANDS.has(b.brand)) - Number(POPULAR_BRANDS.has(a.brand))
      || String(b.release ?? '').localeCompare(String(a.release ?? '')))
      .filter((p) => { const n = perBrand.get(p.brand) ?? 0; if (n >= 2) return false; perBrand.set(p.brand, n + 1); return true })
      .slice(0, 4)
    // пары: из готовых сравнений категории — известные бренды и свежие модели выше
    const bySlug = new Map(all.map((p) => [p.slug, p]))
    const { data: pairs } = await s.from('comparisons')
      .select('relevance, a:products!comparisons_product_a_fkey!inner(slug, category_id), b:products!comparisons_product_b_fkey!inner(slug)')
      .eq('a.category_id', cat.id).order('relevance', { ascending: false }).limit(300)
    type Pr = { relevance: number; a: { slug: string }; b: { slug: string } }
    const score = (x: (typeof all)[number]) => (POPULAR_BRANDS.has(x.brand) ? 2 : 0) + (x.release && Date.parse(x.release) > since ? 1 : 0) + (x.image ? 1 : 0)
    const seen = new Set<string>()
    const compares = ((pairs ?? []) as unknown as Pr[])
      .map((r) => ({ a: bySlug.get(r.a.slug), b: bySlug.get(r.b.slug) }))
      .filter((r): r is { a: (typeof all)[number]; b: (typeof all)[number] } => !!r.a && !!r.b)
      .sort((x, y) => score(y.a) + score(y.b) - score(x.a) - score(x.b))
      .filter((r) => { const k = r.a.slug, m = r.b.slug; if (seen.has(k) || seen.has(m)) return false; seen.add(k); seen.add(m); return true })
      .slice(0, 4)
      .map((r) => ({ name: `${r.a.brand} ${r.a.name} vs ${r.b.brand} ${r.b.name}`, href: compareHref(lang, r.a.slug, r.b.slug) }))
    const best = (await getBestSpecs(lang, cat)).slice(0, 3)
      .map((x) => ({ name: fill(t.ui.bestTitle, { category: cat.name, n: 20, spec: x.label }), href: sectionHref(lang, 'best', cat.slug, x.slug) }))
    out.push({ key, name: cat.name, href: `/${lang}/${cat.slug}`, fresh, compares, best })
  }
  return out
}
