// Записывает категории, характеристики и подписи из categories.mjs в базу (то же, что 0005_categories.sql).
// Запускается в GitHub Actions перед импортом: новая категория в конфиге → сразу в базе, без SQL Editor.
// is_active не трогаем: категорию включает импорт, когда в ней появятся опубликованные модели.
import { createClient } from '@supabase/supabase-js'
import { CATEGORIES, GROUP_LABELS, LANGS, ALL_LANGS } from './categories.mjs'
import { labelFor, groupLabel, categoryI18n, EXTRA_GROUP_KEYS } from './labels.mjs'

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data }

must(await db.from('spec_group_i18n').upsert(
  [...new Set([...Object.keys(GROUP_LABELS), ...EXTRA_GROUP_KEYS])].flatMap((g) => ALL_LANGS
    .filter((lang) => GROUP_LABELS[g] || !LANGS.includes(lang)) // группы смартфонов на 10 языках уже в 0002
    .map((lang) => ({ group_key: g, lang, label: groupLabel(g, lang) }))),
  { onConflict: 'group_key,lang' }), 'groups')

for (const [key, c] of Object.entries(CATEGORIES)) {
  try {
  const cat = must(await db.from('categories').upsert({ key, sort: c.sort, min_specs_to_publish: c.min }, { onConflict: 'key' }).select('id').single(), `cat ${key}`)
  must(await db.from('category_i18n').upsert(ALL_LANGS.filter((lang) => categoryI18n(key, lang)).map((lang) => ({ category_id: cat.id, lang, slug: categoryI18n(key, lang)[0], name: categoryI18n(key, lang)[1] })),
    { onConflict: 'category_id,lang' }), `i18n ${key}`)
  const defs = must(await db.from('spec_definitions').upsert(c.specs.map((s, i) => ({
    category_id: cat.id, key: s.key, group_key: s.group, data_type: s.type, unit: s.unit, higher_is_better: s.hib,
    is_key_spec: s.isKey, is_filter: s.isFilter, sort: (i + 1) * 10 })), { onConflict: 'category_id,key' }).select('id, key'), `defs ${key}`)
  must(await db.from('spec_definition_i18n').upsert(defs.flatMap((d) => ALL_LANGS.map((lang) => ({ spec_id: d.id, lang, label: labelFor(d.key, lang) }))),
    { onConflict: 'spec_id,lang' }), `labels ${key}`)
  console.log(`✓ ${key}: ${defs.length} характеристик`)
  } catch (e) { console.log(`✗ ${key}: ${e.message}`) }
}

// смартфоны (схема из 0002): названия категории и подписи на новых языках
try {
  const cat = must(await db.from('categories').select('id').eq('key', 'smartphones').single(), 'smartphones')
  const extra = ALL_LANGS.filter((l) => !LANGS.includes(l) && categoryI18n('smartphones', l))
  must(await db.from('category_i18n').upsert(extra.map((lang) => ({ category_id: cat.id, lang, slug: categoryI18n('smartphones', lang)[0], name: categoryI18n('smartphones', lang)[1] })),
    { onConflict: 'category_id,lang' }), 'smartphones i18n')
  const defs = must(await db.from('spec_definitions').select('id, key').eq('category_id', cat.id), 'smartphones defs')
  must(await db.from('spec_definition_i18n').upsert(defs.flatMap((d) => extra.map((lang) => ({ spec_id: d.id, lang, label: labelFor(d.key, lang) }))),
    { onConflict: 'spec_id,lang' }), 'smartphones labels')
  console.log(`✓ smartphones: +${extra.length} языков`)
} catch (e) { console.log(`✗ smartphones: ${e.message}`) }
