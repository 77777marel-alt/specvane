// Подписи характеристик: из LABELS (categories.mjs), общие со смартфонами — из 0002_smartphones.sql.
import { readFileSync } from 'node:fs'
import { LABELS, LANGS } from './categories.mjs'

const sql2 = readFileSync(new URL('../../supabase/migrations/0002_smartphones.sql', import.meta.url), 'utf8')
const old = {}
for (const m of sql2.matchAll(/\('([a-z0-9_]+)','([a-z-]+)','((?:[^']|'')*)'\)/g)) (old[m[1]] ??= {})[m[2]] = m[3].replace(/''/g, "'")

export function labelFor(key, lang) {
  if (LABELS[key]) return LABELS[key][LANGS.indexOf(lang)]
  const l = old[key]?.[lang]
  if (!l) throw new Error(`Нет подписи: ${key}/${lang}`)
  return l
}
