#!/usr/bin/env node
// Импорт смартфонов из Open Icecat → Supabase. Запускается GitHub Actions (ночью и вручную).
//
// Фаза A — индекс: скачиваем on_market.index.csv.gz (EN), оставляем категорию 1893 (Smartphones),
//          новые/изменённые позиции кладём в source_items со статусом 'new'.
// Фаза B — карточки: берём до MAX_PRODUCTS позиций 'new', качаем JSON из live API,
//          склеиваем SKU в модели (бренд + семейство + серия), пишем товары, характеристики, фото, идентификаторы.
//
// Переменные окружения:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — обязательно (секреты GitHub)
//   ICECAT_API_TOKEN — токен Open Icecat для индекса (секрет). Без него фаза A пропускается.
//   ICECAT_USER=specvane, MAX_PRODUCTS=300, INDEX=on_market|daily, DRY_RUN=1, SEED_ICECAT_IDS=1,2,3
//
// Лицензия: Open Icecat OCL v1.4 — показывать с пометкой «Database Right data-sheet <год> Icecat»,
// НЕ передавать эти данные в генеративный ИИ. data_source='icecat' у товара — метка для очереди текстов.

import { createClient } from '@supabase/supabase-js'
import { createGunzip } from 'node:zlib'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { createHash } from 'node:crypto'
import { mapSmartphone, modelOf, releaseDate, images, gtins, modelSlug } from './map.mjs'
import { CATEGORIES, mapByConfig } from './categories.mjs'

const env = (k, d) => process.env[k] ?? d
const CATEGORY = process.env.CATEGORY || 'smartphones'
const CFG = CATEGORIES[CATEGORY] ?? null
if (CATEGORY !== 'smartphones' && !CFG) throw new Error(`Неизвестная категория: ${CATEGORY}`)
const ICECAT_CATID = CFG?.catid ?? '1893'
const mapSpecs = CFG ? (d) => mapByConfig(CFG, d) : mapSmartphone
// индекс Icecat качаем один раз и раскладываем позиции по всем нашим категориям
const CAT_BY_ICECAT = { '1893': 'smartphones', ...Object.fromEntries(Object.entries(CATEGORIES).map(([k, c]) => [c.catid, k])) }
const USER = env('ICECAT_USER', 'specvane')
const MAX = Number(env('MAX_PRODUCTS', '5000'))
const INDEX = env('INDEX', 'on_market')
const DRY = env('DRY_RUN') === '1'
const UA = 'SpecvaneImporter/1.0 (+https://specvane.com)'

// продавцы восстановленной техники — не производители, не публикуем
const REFURB = /(refurb|upcycle|renew|recommerce|swappie|back ?market|reboxed|second ?hand|gebraucht)/i
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// запросы к базе с повтором при обрыве связи
const retryFetch = async (url, opts) => {
  for (let a = 1; ; a++) {
    try { return await fetch(url, opts) } catch (e) { if (a >= 4) throw e; await sleep(3000 * a) }
  }
}
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false }, global: { fetch: retryFetch } })
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data }

// ---------- фаза A: индекс ----------
async function phaseIndex() {
  const token = env('ICECAT_API_TOKEN')
  if (!token) { log('ICECAT_API_TOKEN не задан — пропускаю индекс'); return 0 }
  const url = `https://data.icecat.biz/export/freexml/EN/${INDEX}.index.csv.gz`
  log('Индекс:', url)
  const res = await fetch(url, { headers: { 'Api-Token': token, 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Индекс Icecat: HTTP ${res.status}`)
  const rl = createInterface({ input: Readable.fromWeb(res.body).pipe(createGunzip()), crlfDelay: Infinity })
  let head = null, total = 0
  const rows = new Map()
  for await (const line of rl) {
    const cols = line.split('\t')
    if (!head) { head = Object.fromEntries(cols.map((c, i) => [c.trim().toLowerCase(), i])); log('Колонки индекса:', Object.keys(head).join(', ')); continue }
    total++
    const ck = CAT_BY_ICECAT[cols[head.catid]]
    if (!ck) continue
    if ((cols[head.quality] ?? '').toUpperCase() === 'REMOVED') continue
    // «Limited» — карточка закрыта брендом для Open Icecat (live API отдаёт 404)
    if (head.limited != null && /^(1|y|yes|true)$/i.test((cols[head.limited] ?? '').trim())) continue
    const id = cols[head.product_id]
    if (id && !rows.has(id)) rows.set(id, [cols[head.updated] ?? '', ck])
  }
  const per = {}; for (const [, [, ck]] of rows) per[ck] = (per[ck] ?? 0) + 1
  log(`Строк в индексе: ${total}, наших категорий:`, JSON.stringify(per))

  // что уже знаем
  const known = new Map()
  for (let from = 0; ; from += 1000) {
    const part = must(await db.from('source_items').select('external_id, updated').eq('source', 'icecat').range(from, from + 999), 'source_items')
    part.forEach((r) => known.set(r.external_id, r.updated))
    if (part.length < 1000) break
  }
  const changed = [...rows].filter(([id, [upd]]) => known.get(id) !== upd)
    .map(([id, [upd, ck]]) => ({ source: 'icecat', external_id: id, category_key: ck, updated: upd, status: 'new' }))
  log(`Новых/изменённых: ${changed.length}`)
  if (!DRY) for (let i = 0; i < changed.length; i += 500) {
    must(await db.from('source_items').upsert(changed.slice(i, i + 500), { onConflict: 'source,external_id' }), 'upsert source_items')
  }
  return changed.length
}

// ---------- фаза B: карточки ----------
async function fetchSheet(id) {
  const url = `https://live.icecat.biz/api?UserName=${encodeURIComponent(USER)}&Language=en&icecat_id=${id}`
  for (let attempt = 1; attempt <= 3; attempt++) {
    let r
    try { r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) }) }
    catch { await sleep(2000 * attempt); continue }   // обрыв связи — повторяем
    if (r.ok) return (await r.json()).data
    if (r.status === 404 || r.status === 403) return { _error: `HTTP ${r.status}` }
    await sleep(1000 * attempt)
  }
  return { _error: 'retries' }
}

async function pool(items, n, fn) {
  const out = []; let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]) } }))
  return out
}

const hash = (o) => createHash('sha1').update(JSON.stringify(o, Object.keys(o).sort())).digest('hex').slice(0, 16)

async function phaseSheets() {
  const seed = env('SEED_ICECAT_IDS')
  let todo
  if (seed) {
    todo = seed.split(',').map((s) => s.trim()).filter(Boolean).map((id) => ({ external_id: id }))
    if (!DRY) must(await db.from('source_items').upsert(todo.map((t) => ({ source: 'icecat', external_id: t.external_id, category_key: CATEGORY, status: 'new' })),
      { onConflict: 'source,external_id' }), 'seed')
  } else {
    todo = must(await db.from('source_items').select('external_id').eq('source', 'icecat').eq('category_key', CATEGORY).eq('status', 'new')
      .order('updated', { ascending: false }).limit(Math.min(MAX, 1000)), 'todo')
  }
  log(`Карточек к загрузке: ${todo.length}`)
  if (!todo.length) return { models: 0, skus: 0 }

  const cat = must(await db.from('categories').select('id, min_specs_to_publish').eq('key', CATEGORY).single(), 'category')
  const defs = must(await db.from('spec_definitions').select('id, key, data_type').eq('category_id', cat.id), 'spec defs')
  const defByKey = Object.fromEntries(defs.map((d) => [d.key, d]))

  const sheets = await pool(todo, 8, async (t) => ({ id: t.external_id, data: await fetchSheet(t.external_id) }))
  const models = new Map()
  const marks = []
  const unnamed = []
  const stemCache = new Map()
  for (const { id, data } of sheets) {
    if (!data || data._error) { marks.push({ id, status: 'error', note: data?._error ?? 'empty' }); continue }
    if (String(data.GeneralInfo?.Category?.CategoryID) !== ICECAT_CATID) { marks.push({ id, status: 'skipped', note: `not ${CATEGORY}` }); continue }
    const m = modelOf(data, { families: CATEGORY === 'smartphones' })
    // ТВ/мониторы: модель обычно только артикулом (QE55Q60DAUXXU) — его и ищут, берём как название
    if (m && !m.name && CFG?.codeAsName) {
      const code = String(data.GeneralInfo?.BrandPartCode || data.GeneralInfo?.ProductName || '').trim()
      if (code) { m.name = code; m.slug = modelSlug(m.brand, code) }
    }
    if (!m) { marks.push({ id, status: 'skipped', note: 'no brand' }); continue }
    if (REFURB.test(m.brand)) { marks.push({ id, status: 'skipped', note: 'refurbisher' }); continue }
    if (!m.name && !m.stem) { marks.push({ id, status: 'skipped', note: 'no model name' }); continue }
    if (m.stem) {
      // одна основа артикула = одна модель: модель из базы важнее, затем первая в пачке
      const key = `${m.brandSlug}:${m.stem}`
      if (!stemCache.has(key)) {
        const hit = (await db.from('product_identifiers').select('products!inner(slug, name)').eq('kind', 'sku').eq('value', key).maybeSingle()).data
        stemCache.set(key, hit ? { slug: hit.products.slug, name: hit.products.name } : null)
      }
      const known = stemCache.get(key)
      if (known) { addSku({ ...m, ...known }, id, data); marks.push({ id, status: 'imported', slug: known.slug }); continue }
      if (!m.name) { unnamed.push({ id, data, m }); continue }
      stemCache.set(key, { slug: m.slug, name: m.name })
    }
    addSku(m, id, data)
    marks.push({ id, status: 'imported', slug: m.slug })
  }
  function addSku(m, id, data) {
    const specs = mapSpecs(data)
    const colour = (data.FeaturesGroups ?? []).flatMap((g) => g.Features ?? []).find((f) => String(f.Feature?.ID) === '1766')?.RawValue ?? null
    const sku = { icecat_id: Number(id), part: data.GeneralInfo?.BrandPartCode ?? null, code: data.GeneralInfo?.ProductName ?? null,
      gtins: gtins(data), ram: specs.ram, storage: specs.storage, colour, release: releaseDate(data), images: images(data), specs }
    if (!models.has(m.slug)) models.set(m.slug, { ...m, skus: [] })
    const g = models.get(m.slug)
    if (!g.stem && m.stem) g.stem = m.stem
    g.skus.push(sku)
  }

  // SKU без названия → модель с той же основой артикула
  for (const u of unnamed) {
    const key = `${u.m.brandSlug}:${u.m.stem}`
    const known = stemCache.get(key)
    if (!known) { marks.push({ id: u.id, status: 'skipped', note: `stem:${key}` }); continue }
    const { slug, name } = known
    addSku({ ...u.m, name, slug }, u.id, u.data)
    marks.push({ id: u.id, status: 'imported', slug })
  }
  log(`Моделей в пачке: ${models.size}`)
  if (DRY) { for (const [slug, m] of models) log(slug, m.skus.length, 'SKU'); return { models: models.size, skus: sheets.length } }

  const productIdBySlug = {}
  for (const m of models.values()) {
    // бренд
    must(await db.from('brands').upsert({ slug: m.brandSlug, name: m.brand }, { onConflict: 'slug', ignoreDuplicates: true }), 'brand')
    const brand = must(await db.from('brands').select('id').eq('slug', m.brandSlug).single(), 'brand id')

    // существующая модель: объединяем варианты
    const existing = (await db.from('products').select('id, variants, data_source, status').eq('slug', m.slug).maybeSingle()).data
    const variants = new Map((existing?.variants ?? []).map((v) => [v.icecat_id, v]))
    for (const s of m.skus) variants.set(s.icecat_id, { icecat_id: s.icecat_id, part: s.part, gtins: s.gtins, ram: s.ram, storage: s.storage, colour: s.colour })
    const vlist = [...variants.values()].sort((a, b) => (a.storage ?? 1e9) - (b.storage ?? 1e9))

    // характеристики модели: базовый вариант (меньше памяти), пропуски — из других вариантов
    const base = [...m.skus].sort((a, b) => (a.storage ?? 1e9) - (b.storage ?? 1e9))
    const specs = { ...base[0].specs }
    for (const s of base.slice(1)) for (const [k, v] of Object.entries(s.specs)) if (specs[k] == null && v != null) specs[k] = v
    const filled = Object.entries(specs).filter(([k, v]) => v != null && defByKey[k])
    const imgs = base.find((s) => s.images.length)?.images ?? []
    const release = m.skus.map((s) => s.release).filter(Boolean).sort()[0] ?? null
    const status = (filled.length >= cat.min_specs_to_publish && imgs.length) || (existing?.data_source === 'official' && existing.status === 'active') ? 'active' : 'draft'

    const row = { category_id: cat.id, brand_id: brand.id, slug: m.slug, name: m.name, model_number: base[0].code,
      release_date: release, status, is_indexable: status === 'active', spec_count: filled.length, specs_hash: hash(specs), data_source: 'icecat', variants: vlist }
    const prod = must(await db.from('products').upsert(row, { onConflict: 'slug' }).select('id').single(), `product ${m.slug}`)
    productIdBySlug[m.slug] = prod.id

    // характеристики
    const specRows = filled.map(([k, v]) => ({
      product_id: prod.id, spec_id: defByKey[k].id, source: `icecat:${base[0].icecat_id}`,
      value_num: typeof v === 'number' ? v : null, value_bool: typeof v === 'boolean' ? v : null, value_text: typeof v === 'string' ? v : null,
      updated_at: new Date().toISOString(),
    }))
    // официальные значения производителя не перезаписываем
    const official = new Set((must(await db.from('product_specs').select('spec_id').eq('product_id', prod.id).like('source', 'official:%'), 'official specs') ?? []).map((r) => r.spec_id))
    const toWrite = specRows.filter((r) => !official.has(r.spec_id))
    if (toWrite.length) must(await db.from('product_specs').upsert(toWrite, { onConflict: 'product_id,spec_id' }), 'specs')

    // фото (заменяем набор фото из Icecat целиком)
    must(await db.from('product_images').delete().eq('product_id', prod.id).eq('source', 'icecat'), 'del images')
    if (imgs.length) must(await db.from('product_images').insert(imgs.map((url, i) => ({ product_id: prod.id, url, source: 'icecat', source_ref: String(base[0].icecat_id), sort: i }))), 'images')

    // идентификаторы (чужие совпадения пропускаем)
    const ids = m.skus.flatMap((s) => [
      { product_id: prod.id, kind: 'icecat', value: String(s.icecat_id), country: '' },
      ...s.gtins.map((g) => ({ product_id: prod.id, kind: 'gtin', value: g, country: '' })),
      ...(s.part ? [{ product_id: prod.id, kind: 'mpn', value: s.part, country: '' }] : []),
    ]).concat(m.stem ? [{ product_id: prod.id, kind: 'sku', value: `${m.brandSlug}:${m.stem}`, country: '' }] : [])
    must(await db.from('product_identifiers').upsert(ids, { onConflict: 'kind,value,country', ignoreDuplicates: true }), 'identifiers')
    log(`✓ ${m.brand} ${m.name}: ${filled.length} характеристик, ${imgs.length} фото, ${vlist.length} вариантов, ${status}`)
  }

  // отметки в журнале позиций
  const now = new Date().toISOString()
  const rows = marks.map((mk) => ({ source: 'icecat', external_id: String(mk.id), category_key: CATEGORY, status: mk.status,
    note: mk.note ?? null, fetched_at: now, product_id: mk.slug ? productIdBySlug[mk.slug] ?? null : null }))
  for (let i = 0; i < rows.length; i += 500) {
    must(await db.from('source_items').upsert(rows.slice(i, i + 500), { onConflict: 'source,external_id' }), 'marks')
  }
  // SKU без названия, ждавшие свою модель: если основа артикула теперь известна — в очередь снова
  const learned = [...models.values()].filter((g) => g.stem).map((g) => `stem:${g.brandSlug}:${g.stem}`)
  if (learned.length) must(await db.from('source_items').update({ status: 'new' }).eq('source', 'icecat').eq('status', 'skipped').in('note', learned), 'reopen')
  return { models: models.size, skus: sheets.length }
}

async function main() {
  const feed = DRY ? null : must(await db.from('feeds').select('id').eq('name', 'icecat-open').single(), 'feed')
  const run = DRY ? null : must(await db.from('feed_runs').insert({ feed_id: feed.id }).select('id').single(), 'run')
  try {
    const changed = env('SKIP_INDEX') === '1' ? 0 : await phaseIndex()
    const r = { models: 0, skus: 0 }
    for (let done = 0; done < MAX; ) {
      let part
      try { part = await phaseSheets() }
      catch (e) { log('Пачка прервана, сохраняем сделанное:', String(e).slice(0, 300)); break }
      r.models += part.models; r.skus += part.skus; done += part.skus
      if (!part.skus || env('SEED_ICECAT_IDS')) break
    }
    if (!DRY) {
      const { data: pairs, error } = await db.rpc('rebuild_comparisons', { p_category: CATEGORY, p_per: 5 })
      if (error) log('Сравнения: ошибка', error.message); else log('Сравнений A vs B:', pairs)
      // категория появляется на сайте, когда в ней есть опубликованные модели
      const cat = must(await db.from('categories').select('id, is_active').eq('key', CATEGORY).single(), 'category')
      const { count } = await db.from('products').select('id', { count: 'exact', head: true }).eq('category_id', cat.id).eq('is_indexable', true)
      if (count > 0 && !cat.is_active) { must(await db.from('categories').update({ is_active: true }).eq('id', cat.id), 'activate'); log('Категория включена на сайте') }
      log(`Опубликовано моделей в категории: ${count}`)
    }
    if (run) must(await db.from('feed_runs').update({ status: 'ok', finished_at: new Date().toISOString(),
      items_seen: r.skus, items_new: changed, items_updated: r.models }).eq('id', run.id), 'run ok')
    log('Готово:', r)
  } catch (e) {
    if (run) await db.from('feed_runs').update({ status: 'error', finished_at: new Date().toISOString(), error: String(e).slice(0, 2000) }).eq('id', run.id)
    console.error(e)
    process.exit(1)
  }
}
main()
