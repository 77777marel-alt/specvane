// Автоматическая настройка категорий из Open Icecat (для icecat_categories.selected = true):
// по пробе карточек выбираем частые признаки → характеристики (ключ f<ID признака>), подписи и названия
// на 10 языках берём у самого Icecat. Категория включается импортом, когда в ней появятся модели.
import { createClient } from '@supabase/supabase-js'
import { flatFeatures, slugify } from './map.mjs'
import { CATEGORIES, LANGS } from './categories.mjs'
import { AUTO_CATIDS } from './auto-list.mjs'

const env = (k, d) => process.env[k] ?? d
const UA = 'SpecvaneImporter/1.0 (+https://specvane.com)'
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data }
const ICECAT_LANG = { en: 'en', de: 'de', fr: 'fr', it: 'it', es: 'es', nl: 'nl', pl: 'pl', sv: 'sv', 'pt-br': 'BR', ja: 'ja' }
const MANUAL = new Set(['1893', ...Object.values(CATEGORIES).flatMap((c) => [].concat(c.catid))])

// служебные признаки: упаковка, логистика, сертификаты — не характеристики товара
const SKIP = /package|packag|pallet|master \(|carton|warranty|certific|complian|country of origin|harmonized|commodity|ECCN|GTIN|EAN|UPC|quantity|box contents|quick start|manual|safety|sustainab|bundled|trial|cables included|declaration|RoHS|REACH|label|logo|operating (temperature|relative)|storage (temperature|relative)|altitude|shipping|product colou?r|^colou?r/i
const LOWER_BETTER = /weight|noise|power consumption|energy consumption|response time|charging time|recharge time|thickness|depth|latency|price/i
const HIGHER_BETTER = /capacity|resolution|brightness|battery life|playback time|speed|frequency|memory|storage|power \(|output power|contrast|megapixel|cores|threads|bandwidth|range/i
const NOT_KEY = /^(width|depth|height|weight|length)|dimensions/i

async function sheet(id, lang = 'en') {
  try {
    const r = await fetch(`https://live.icecat.biz/api?UserName=specvane&Language=${lang}&icecat_id=${id}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
    return r.ok ? (await r.json()).data : null
  } catch { return null }
}
const groupsOf = (data) => {
  const m = new Map()
  for (const g of data?.FeaturesGroups ?? []) for (const f of g.Features ?? []) m.set(Number(f.Feature?.ID), { gid: String(g.FeatureGroup?.ID ?? ''), gname: String(g.FeatureGroup?.Name?.Value ?? '') })
  return m
}
const isNum = (v) => v !== '' && Number.isFinite(Number(String(v).replace(',', '.')))

// список из auto-list.mjs → отмечаем выбранными (разведка должна была их найти)
if (AUTO_CATIDS.length) must(await db.from('icecat_categories').update({ selected: true }).in('catid', AUTO_CATIDS), 'select')
const todo = must(await db.from('icecat_categories').select('catid, name_en, sample_ids, sku_count').eq('selected', true).is('category_key', null), 'todo')
log(`К настройке: ${todo.length}`)
const usedSlugs = new Set((must(await db.from('category_i18n').select('lang, slug'), 'slugs')).map((r) => `${r.lang}:${r.slug}`))
const usedKeys = new Set((must(await db.from('categories').select('key'), 'keys')).map((r) => r.key))

async function pool(items, n, fn) {
  let k = 0
  await Promise.all(Array.from({ length: n }, async () => { while (k < items.length) { const it = items[k++]; try { await fn(it) } catch (e) { log(`${it.catid}: ошибка — ${e.message}`) } } }))
}

// по 6 категорий параллельно: каждая — ~80 запросов к Icecat
await pool(todo, 6, async (ic) => {
  if (MANUAL.has(ic.catid)) { log(`${ic.catid}: настроена вручную — пропуск`); return }
  // проба: до 30 открытых карточек
  const samples = []
  for (const id of ic.sample_ids) { if (samples.length >= 30) break; const d = await sheet(id); if (d) samples.push({ id, d }) }
  if (samples.length < 5) { log(`${ic.catid} ${ic.name_en}: мало открытых карточек (${samples.length}) — пропуск`); return }

  const stats = new Map()
  let order = 0
  for (const { d } of samples) {
    const gs = groupsOf(d)
    for (const f of flatFeatures(d)) {
      if (!f.id || !f.name || SKIP.test(f.name) || f.raw === '') continue
      let s = stats.get(f.id)
      if (!s) stats.set(f.id, (s = { id: f.id, name: f.name, unit: f.unit, n: 0, vals: new Set(), order: order++, g: gs.get(f.id) }))
      s.n++; s.vals.add(f.raw)
    }
  }
  const pick = [...stats.values()].filter((s) => s.n >= samples.length * 0.35).sort((a, b) => b.n - a.n).slice(0, 28).sort((a, b) => a.order - b.order)
  if (pick.length < 6) { log(`${ic.catid} ${ic.name_en}: мало общих признаков (${pick.length}) — пропуск`); return }
  for (const s of pick) {
    const vals = [...s.vals]
    s.type = vals.every((v) => v === 'Y' || v === 'N') ? 'bool' : vals.every(isNum) ? 'number' : 'text'
    s.hib = s.type === 'bool' ? true : s.type === 'number' ? (LOWER_BETTER.test(s.name) ? false : HIGHER_BETTER.test(s.name) ? true : null) : null
    s.filter = s.type === 'number' || (s.type === 'bool' && s.n >= samples.length * 0.5) || (s.type === 'text' && vals.length <= 12)
  }
  const keys = pick.filter((s) => s.type !== 'bool' && !NOT_KEY.test(s.name)).sort((a, b) => b.n - a.n).slice(0, 4).map((s) => s.id)

  // названия и подписи на 10 языках — от Icecat (по двум открытым карточкам)
  const names = {}, labels = {}, glabels = {}
  for (const lang of LANGS) {
    for (const { id } of samples.slice(0, 2)) {
      const d = lang === 'en' ? samples.find((x) => x.id === id).d : await sheet(id, ICECAT_LANG[lang])
      if (!d) continue
      names[lang] ??= d.GeneralInfo?.Category?.Name?.Value
      const gs = groupsOf(d)
      for (const f of flatFeatures(d)) { (labels[f.id] ??= {})[lang] ??= f.name; const g = gs.get(f.id); if (g?.gname) (glabels[g.gid] ??= {})[lang] ??= g.gname }
    }
  }
  const nameEn = names.en ?? ic.name_en
  let key = slugify(nameEn).slice(0, 60)
  if (usedKeys.has(key)) key = `${key}-${ic.catid}`
  usedKeys.add(key)

  const cat = must(await db.from('categories').insert({ key, sort: Math.round(1000 + Math.max(0, 100000 - ic.sku_count) / 1000), is_active: false,
    min_specs_to_publish: Math.min(8, Math.max(5, Math.round(pick.length * 0.4))), icecat_catid: ic.catid, auto: true }).select('id').single(), `cat ${key}`)

  const i18n = LANGS.map((lang) => {
    const nm = names[lang] ?? nameEn
    let slug = lang === 'ja' ? slugify(nameEn) : slugify(nm) || slugify(nameEn)
    slug = slug.slice(0, 70)
    if (usedSlugs.has(`${lang}:${slug}`)) slug = `${slug}-${ic.catid}`
    usedSlugs.add(`${lang}:${slug}`)
    return { category_id: cat.id, lang, slug, name: nm }
  })
  must(await db.from('category_i18n').insert(i18n), 'i18n')

  const gkey = (s) => `g_${slugify(s.g?.gname || 'general').replace(/-/g, '_').slice(0, 40)}`
  const groups = new Map()
  for (const s of pick) if (s.g?.gid) groups.set(gkey(s), glabels[s.g.gid] ?? {})
  const gRows = [...groups].flatMap(([g, ls]) => LANGS.map((lang) => ({ group_key: g, lang, label: ls[lang] ?? ls.en ?? g })))
  if (gRows.length) must(await db.from('spec_group_i18n').upsert(gRows, { onConflict: 'group_key,lang' }), 'groups')

  const defs = must(await db.from('spec_definitions').insert(pick.map((s, i) => ({
    category_id: cat.id, key: `f${s.id}`, group_key: gkey(s), data_type: s.type, unit: s.type === 'number' ? (s.unit || null) : null,
    higher_is_better: s.hib, is_key_spec: keys.includes(s.id), is_filter: s.filter, sort: (i + 1) * 10 }))).select('id, key'), 'defs')
  must(await db.from('spec_definition_i18n').insert(defs.flatMap((d) => {
    const fid = Number(d.key.slice(1))
    return LANGS.map((lang) => ({ spec_id: d.id, lang, label: labels[fid]?.[lang] ?? labels[fid]?.en ?? stats.get(fid).name }))
  })), 'labels')
  must(await db.from('icecat_categories').update({ category_key: key, updated_at: new Date().toISOString() }).eq('catid', ic.catid), 'mark')
  log(`✓ ${ic.catid} ${nameEn} → ${key}: ${pick.length} характеристик (${samples.length} карточек в пробе), ${ic.sku_count} позиций`)
})
