// Импорт характеристик с официальных сайтов производителей (data/official/<category>.json).
// Официальные значения главнее Icecat: перезаписывают характеристику и помечаются source 'official:<url>'.
// Фото не добавляем (только разрешённые источники). Товар публикуется, если характеристик >= порога категории.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { modelSlug, slugify } from '../icecat/map.mjs'

const env = (k, d) => process.env[k] ?? d
const CATEGORY = env('CATEGORY', 'smartphones')
const DRY = env('DRY_RUN') === '1'
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data }
const hash = (o) => createHash('sha1').update(JSON.stringify(o)).digest('hex').slice(0, 16)

const items = JSON.parse(readFileSync(new URL(`../../data/official/${CATEGORY}.json`, import.meta.url), 'utf8'))
log(`Моделей в файле: ${items.length}`)
if (DRY) { for (const p of items) log(modelSlug(p.brand, p.name), Object.keys(p.specs).length); process.exit(0) }

const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
const cat = must(await db.from('categories').select('id, min_specs_to_publish').eq('key', CATEGORY).single(), 'category')
const defs = must(await db.from('spec_definitions').select('id, key, data_type').eq('category_id', cat.id), 'defs')
const defByKey = Object.fromEntries(defs.map((d) => [d.key, d]))

let n = 0
for (const p of items) {
  const brandSlug = slugify(p.brand)
  must(await db.from('brands').upsert({ slug: brandSlug, name: p.brand }, { onConflict: 'slug', ignoreDuplicates: true }), 'brand')
  const brand = must(await db.from('brands').select('id').eq('slug', brandSlug).single(), 'brand id')
  const slug = modelSlug(p.brand, p.name)
  const existing = (await db.from('products').select('id, data_source, variants, release_date').eq('slug', slug).maybeSingle()).data

  // значения по типу характеристики
  const rows = []
  for (const [k, v] of Object.entries(p.specs)) {
    const d = defByKey[k]; if (!d || v == null) continue
    const r = { value_num: null, value_bool: null, value_text: null }
    if (d.data_type === 'number' && typeof v === 'number') r.value_num = v
    else if (d.data_type === 'bool' && typeof v === 'boolean') r.value_bool = v
    else if (d.data_type === 'text') r.value_text = String(v)
    else continue
    rows.push({ key: k, spec_id: d.id, ...r })
  }

  // уже сохранённые характеристики (например, из Icecat) — учитываем при подсчёте
  let filled = rows.length
  if (existing) {
    const have = must(await db.from('product_specs').select('spec_id').eq('product_id', existing.id), 'have')
    filled = new Set([...have.map((h) => h.spec_id), ...rows.map((r) => r.spec_id)]).size
  }
  const status = filled >= cat.min_specs_to_publish ? 'active' : 'draft'
  const variants = existing?.variants?.length ? existing.variants
    : (p.storage_options_gb ?? []).map((s) => ({ storage: s, ram: null, colour: null }))

  const row = { category_id: cat.id, brand_id: brand.id, slug, name: p.name,
    release_date: p.release_date ?? existing?.release_date ?? null, status, is_indexable: status === 'active',
    spec_count: filled, specs_hash: hash(p.specs), data_source: existing?.data_source ?? 'official', variants }
  const prod = must(await db.from('products').upsert(row, { onConflict: 'slug' }).select('id').single(), `product ${slug}`)

  const now = new Date().toISOString()
  if (rows.length) must(await db.from('product_specs').upsert(rows.map(({ key, ...r }) => ({
    product_id: prod.id, ...r, source: `official:${p.source_url}`, updated_at: now })), { onConflict: 'product_id,spec_id' }), 'specs')
  n++
  log(`✓ ${p.brand} ${p.name} (${slug}): ${rows.length} офиц., всего ${filled}, ${status}${existing ? ', дополнен' : ', новый'}`)
}

must(await db.rpc('rebuild_comparisons', { p_category: CATEGORY, p_per: 5 }), 'comparisons')
log(`Готово: ${n} моделей, сравнения пересчитаны`)
