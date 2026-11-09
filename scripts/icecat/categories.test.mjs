import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORIES, mapByConfig, LABELS, LANGS } from './categories.mjs'

const f = (ID, name, raw, sign = '') => ({ Feature: { ID, Name: { Value: name }, Measure: { Signs: { _: sign } } }, RawValue: raw })
const card = (...features) => ({ FeaturesGroups: [{ Features: features }] })

test('наушники: ANC, автономия, вес', () => {
  const s = mapByConfig(CATEGORIES.headphones, card(
    f(8136, 'Wearing style', 'Head-band'), f(39802, 'Noise canceling type', 'Active'),
    f(2169, 'Continuous audio playback time', '57', 'h'), f(94, 'Weight', '157', 'g'),
    f(1887, 'Headphone frequency', '20 - 20000'), f(14760, '3.5 mm connector', 'N')))
  assert.equal(s.wearing_style, 'Head-band'); assert.equal(s.anc, true); assert.equal(s.battery_life, 57)
  assert.equal(s.weight, 157); assert.equal(s.frequency_range, '20 - 20000 Hz'); assert.equal(s.headphone_jack, false)
})

test('ноутбук: процессор, память, вес в кг, видеокарта', () => {
  const s = mapByConfig(CATEGORIES.laptops, card(
    f(2196, 'Processor family', 'Intel N'), f(47, 'Processor model', 'N200'), f(11381, 'Internal memory', '8', 'GB'),
    f(3318, 'Total storage capacity', '1', 'TB'), f(94, 'Weight', '1550', 'g'),
    f(9018, 'Discrete graphics card model', 'Not available'), f(9016, 'On-board graphics card model', 'Intel UHD Graphics')))
  assert.equal(s.cpu, 'Intel N N200'); assert.equal(s.ram, 8); assert.equal(s.storage, 1024)
  assert.equal(s.weight_kg, 1.55); assert.equal(s.gpu, 'Intel UHD Graphics')
})

test('ТВ: запасной признак частоты, разрешение', () => {
  const s = mapByConfig(CATEGORIES.tvs, card(f(7450, 'Maximum refresh rate', '120', 'Hz'), f(1585, 'Display resolution', '3840 x 2160')))
  assert.equal(s.refresh_rate, 120); assert.equal(s.display_resolution, '3840 × 2160')
})

test('подписи есть на всех языках', () => {
  for (const [k, v] of Object.entries(LABELS)) assert.equal(v.length, LANGS.length, k) // 10 базовых языков; новые — в i18n-extra.json
  for (const c of Object.values(CATEGORIES)) for (const l of LANGS) assert.ok(c.i18n[l]?.[0]?.match(/^[a-z0-9-]+$/), l)
})

test('новые языки: подписи всех характеристик, групп и названия категорий', async () => {
  const { EXTRA_LANGS } = await import('./categories.mjs')
  const { labelFor, groupLabel, categoryI18n } = await import('./labels.mjs')
  const { readFileSync } = await import('node:fs')
  const extra = JSON.parse(readFileSync(new URL('./i18n-extra.json', import.meta.url), 'utf8'))
  for (const [key, c] of Object.entries(CATEGORIES)) for (const l of EXTRA_LANGS) {
    const ci = categoryI18n(key, l); assert.ok(ci && /^[a-z0-9-]+$/.test(ci[0]), `${key}/${l}`)
    for (const sp of c.specs) { assert.ok(extra.labels[sp.key]?.[l], `${sp.key}/${l}`); assert.ok(labelFor(sp.key, l)); assert.ok(groupLabel(sp.group, l)) }
  }
})
