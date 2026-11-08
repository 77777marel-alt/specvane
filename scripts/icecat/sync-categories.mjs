// Записывает категории, характеристики и подписи из categories.mjs в базу (то же, что 0005_categories.sql).
// Запускается в GitHub Actions перед импортом: новая категория в конфиге → сразу в базе, без SQL Editor.
// is_active не трогаем: категорию включает импорт, когда в ней появятся опубликованные модели.
import { createClient } from '@supabase/supabase-js'
import { CATEGORIES, GROUP_LABELS, LANGS } from './categories.mjs'
import { labelFor } from './labels.mjs'

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data }

must(await db.from('spec_group_i18n').upsert(
  Object.entries(GROUP_LABELS).flatMap(([g, ls]) => LANGS.map((lang, i) => ({ group_key: g, lang, label: ls[i] }))),
  { onConflict: 'group_key,lang' }), 'groups')

for (const [key, c] of Object.entries(CATEGORIES)) {
  const existing = (await db.from('categories').select('id').eq('key', key).maybeSingle()).data
  const cat = existing
    ? must(await db.from('categories').update({ sort: c.sort, min_specs_to_publish: c.min }).eq('id', existing.id).select('id').single(), 'cat')
    : must(await db.from('categories').insert({ key, sort: c.sort, min_specs_to_publish: c.min, is_active: false }).select('id').single(), 'cat')
  must(await db.from('category_i18n').upsert(LANGS.map((lang) => ({ category_id: cat.id, lang, slug: c.i18n[lang][0], name: c.i18n[lang][1] })),
    { onConflict: 'category_id,lang' }), `i18n ${key}`)
  const defs = must(await db.from('spec_definitions').upsert(c.specs.map((s, i) => ({
    category_id: cat.id, key: s.key, group_key: s.group, data_type: s.type, unit: s.unit, higher_is_better: s.hib,
    is_key_spec: s.isKey, is_filter: s.isFilter, sort: (i + 1) * 10 })), { onConflict: 'category_id,key' }).select('id, key'), `defs ${key}`)
  must(await db.from('spec_definition_i18n').upsert(defs.flatMap((d) => LANGS.map((lang) => ({ spec_id: d.id, lang, label: labelFor(d.key, lang) }))),
    { onConflict: 'spec_id,lang' }), `labels ${key}`)
  console.log(`✓ ${key}: ${defs.length} характеристик`)
}
