// Подписи характеристик, групп и категорий на всех языках сайта.
// 10 первых языков — в categories.mjs (LABELS/GROUP_LABELS/i18n) и 0002_smartphones.sql; волна 2 — i18n-extra.json.
import { readFileSync } from 'node:fs'
import { LABELS, LANGS, GROUP_LABELS, CATEGORIES } from './categories.mjs'

const sql2 = readFileSync(new URL('../../supabase/migrations/0002_smartphones.sql', import.meta.url), 'utf8')
const old = {}
for (const m of sql2.matchAll(/\('([a-z0-9_]+)','([a-z-]+)','((?:[^']|'')*)'\)/g)) (old[m[1]] ??= {})[m[2]] = m[3].replace(/''/g, "'")
const EXTRA = JSON.parse(readFileSync(new URL('./i18n-extra.json', import.meta.url), 'utf8'))

export function labelFor(key, lang) {
  if (!LANGS.includes(lang)) {
    const l = EXTRA.labels[key]?.[lang]
    if (l) return l
    return labelFor(key, 'en')
  }
  if (LABELS[key]) return LABELS[key][LANGS.indexOf(lang)]
  const l = old[key]?.[lang]
  if (!l) throw new Error(`Нет подписи: ${key}/${lang}`)
  return l
}

/** Подпись группы характеристик (раздела таблицы). */
export function groupLabel(g, lang) {
  if (LANGS.includes(lang) && GROUP_LABELS[g]) return GROUP_LABELS[g][LANGS.indexOf(lang)]
  return EXTRA.groups[g]?.[lang] ?? (GROUP_LABELS[g]?.[0] ?? g)
}

/** [slug, название] категории на языке. */
export function categoryI18n(key, lang) {
  if (LANGS.includes(lang)) return key === 'smartphones' ? null : CATEGORIES[key].i18n[lang]
  return EXTRA.categories[key]?.[lang] ?? null
}

/** Группы, у которых есть подписи на новых языках (вкл. группы смартфонов из 0002). */
export const EXTRA_GROUP_KEYS = Object.keys(EXTRA.groups)
