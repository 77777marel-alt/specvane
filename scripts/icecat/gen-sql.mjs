// Строит миграцию категорий из scripts/icecat/categories.mjs:
//   node scripts/icecat/gen-sql.mjs > supabase/migrations/0005_categories.sql
// Подписи характеристик берутся из LABELS, а общие со смартфонами — из 0002_smartphones.sql.
import { CATEGORIES, GROUP_LABELS, LANGS } from './categories.mjs'
import { labelFor as label } from './labels.mjs'

const q = (v) => (v == null ? 'null' : typeof v === 'boolean' || typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)

const out = ['-- 0005: категории из Open Icecat (сгенерировано scripts/icecat/gen-sql.mjs — не править вручную)', 'begin;', '']

out.push('insert into public.spec_group_i18n (group_key, lang, label) values')
out.push(Object.entries(GROUP_LABELS).flatMap(([g, ls]) => LANGS.map((l, i) => `(${q(g)},${q(l)},${q(ls[i])})`)).join(',\n'))
out.push('on conflict (group_key, lang) do update set label = excluded.label;', '')

for (const [key, c] of Object.entries(CATEGORIES)) {
  out.push(`-- ${key}`)
  out.push(`insert into public.categories (key, sort, is_active, min_specs_to_publish) values (${q(key)}, ${c.sort}, false, ${c.min})`)
  out.push('  on conflict (key) do update set sort = excluded.sort, min_specs_to_publish = excluded.min_specs_to_publish;')
  out.push('insert into public.category_i18n (category_id, lang, slug, name) values')
  out.push(LANGS.map((l) => `  ((select id from public.categories where key = ${q(key)}), ${q(l)}, ${q(c.i18n[l][0])}, ${q(c.i18n[l][1])})`).join(',\n'))
  out.push('on conflict (category_id, lang) do update set slug = excluded.slug, name = excluded.name;')
  out.push('insert into public.spec_definitions (category_id, key, group_key, data_type, unit, higher_is_better, is_key_spec, is_filter, sort) values')
  out.push(c.specs.map((s, i) => `  ((select id from public.categories where key = ${q(key)}), ${q(s.key)}, ${q(s.group)}, ${q(s.type)}, ${q(s.unit)}, ${q(s.hib)}, ${s.isKey}, ${s.isFilter}, ${(i + 1) * 10})`).join(',\n'))
  out.push('on conflict (category_id, key) do update set group_key = excluded.group_key, data_type = excluded.data_type, unit = excluded.unit,')
  out.push('  higher_is_better = excluded.higher_is_better, is_key_spec = excluded.is_key_spec, is_filter = excluded.is_filter, sort = excluded.sort;')
  out.push('insert into public.spec_definition_i18n (spec_id, lang, label)')
  out.push('select s.id, v.lang, v.label from (values')
  out.push(c.specs.flatMap((s) => LANGS.map((l) => `(${q(s.key)},${q(l)},${q(label(s.key, l))})`)).join(',\n'))
  out.push(`) v(key, lang, label) join public.spec_definitions s on s.key = v.key and s.category_id = (select id from public.categories where key = ${q(key)})`)
  out.push('on conflict (spec_id, lang) do update set label = excluded.label;', '')
}
out.push('commit;')
console.log(out.join('\n'))
