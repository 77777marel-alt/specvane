import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mapSmartphone, modelOf, releaseDate, images, gtins, slugify } from './map.mjs'

const s22 = JSON.parse(readFileSync(new URL('./fixture-s22.json', import.meta.url)))

test('характеристики Galaxy S22', () => {
  const s = mapSmartphone(s22)
  assert.equal(s.display_size, 6.1)
  assert.equal(s.display_type, 'Dynamic AMOLED 2X')
  assert.equal(s.display_resolution, '2340 × 1080')
  assert.equal(s.refresh_rate, 120)
  assert.equal(s.peak_brightness, 500)
  assert.equal(s.chipset, 'Samsung Exynos 2200')
  assert.equal(s.ram, 8)
  assert.equal(s.storage, 128)
  assert.equal(s.main_camera, 50)
  assert.equal(s.optical_zoom, 3)
  assert.equal(s.front_camera, 10)
  assert.equal(s.video_max, '8K @ 24 fps')
  assert.equal(s.battery, 3700)
  assert.equal(s.weight, 167) // не вес упаковки
  assert.equal(s.thickness, 7.6)
  assert.equal(s.ip_rating, 'IP68')
  assert.equal(s.five_g, true)
  assert.equal(s.esim, true)
  assert.equal(s.nfc, true)
  assert.equal(s.usb, 'USB Type-C (3.2 Gen 1 (3.1 Gen 1))')
  assert.equal(s.headphone_jack, false)
  assert.equal(s.os, 'Android 12')
  assert.equal(s.expandable_storage, null) // нет данных — не «нет слота»
  assert.equal(s.wireless_charging, null) // только «да», без ватт
  assert.equal(Object.keys(s).length, 30)
})

test('модель и варианты', () => {
  assert.deepEqual(modelOf(s22), { brand: 'Samsung', brandSlug: 'samsung', name: 'Galaxy S22', slug: 'samsung-galaxy-s22' })
  assert.equal(releaseDate(s22), '2022-01-17')
  assert.deepEqual(gtins(s22), ['8806092878488', '8806092878495'])
  assert.equal(images(s22).length, 2)
  assert.ok(images(s22)[0].includes('gallery_mediums'))
})

test('slug', () => {
  assert.equal(slugify('Apple iPhone 16 Pro Max'), 'apple-iphone-16-pro-max')
  assert.equal(slugify('Xiaomi Redmi Note 14 Pro+'), 'xiaomi-redmi-note-14-pro-plus')
  assert.equal(slugify('Motorola Moto G85 5G'), 'motorola-moto-g85-5g')
})

test('единицы памяти MB/TB', () => {
  const d = { FeaturesGroups: [{ Features: [
    { Feature: { ID: '7861', Name: { Value: 'RAM capacity' }, Measure: { Signs: { _: 'MB' } } }, RawValue: '4096' },
    { Feature: { ID: '8730', Name: { Value: 'Internal storage capacity' }, Measure: { Signs: { _: 'TB' } } }, RawValue: '1' },
  ] }] }
  const s = mapSmartphone(d)
  assert.equal(s.ram, 4)
  assert.equal(s.storage, 1024)
})
