import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mapSmartphone, modelOf, releaseDate, images, gtins, slugify, isCode } from './map.mjs'

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
  assert.equal(Object.keys(s).length, 32) // 30 из 0002 + ширина и высота
})

test('модель и варианты', () => {
  assert.deepEqual(modelOf(s22), { brand: 'Samsung', brandSlug: 'samsung', name: 'Galaxy S22', slug: 'samsung-galaxy-s22', stem: 'SM-S901' })
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

const gi = (o) => ({ GeneralInfo: o })
test('названия моделей из реальных случаев Icecat', () => {
  // семейство есть, серии нет, название в ProductName
  assert.equal(modelOf(gi({ Brand: 'Samsung', ProductFamily: { Value: 'Galaxy' }, ProductName: 'A27 5G', BrandPartCode: 'SM-A276BZKBEEE' })).name, 'Galaxy A27 5G')
  // семейства нет — подставляем Galaxy
  assert.equal(modelOf(gi({ Brand: 'Samsung', ProductSeries: { Value: 'S25 FE' }, ProductName: 'SM-S731B' })).slug, 'samsung-galaxy-s25-fe')
  // только артикул — без названия, но с основой артикула
  const m = modelOf(gi({ Brand: 'Samsung', ProductName: 'SM-F766BDBGEUB smartphone', BrandPartCode: 'SM-F766BDBGEUB' }))
  assert.equal(m.name, null); assert.equal(m.stem, 'SM-F766')
  // ProductName уже содержит семейство
  assert.equal(modelOf(gi({ Brand: 'Samsung', ProductFamily: { Value: 'Galaxy' }, ProductName: 'Galaxy A16' })).name, 'Galaxy A16')
  // Honor без семейства
  assert.equal(modelOf(gi({ Brand: 'Honor', ProductName: '200 5G', BrandPartCode: '6936520852376' })).slug, 'honor-200-5g')
  assert.equal(isCode('SM-F766BDBGEUB'), true); assert.equal(isCode('A27 5G'), false); assert.equal(isCode('6936520852376'), true)
})

test('мусор в названиях', () => {
  assert.equal(modelOf(gi({ Brand: 'Samsung', ProductFamily: { Value: 'Galaxy' }, ProductName: 'GALAXY A27 5G 8/256GB AKILLI TELEFON MAVI' })).name, 'Galaxy A27 5G')
  assert.equal(modelOf(gi({ Brand: 'Samsung', ProductFamily: { Value: 'Galaxy' }, ProductSeries: { Value: 'Z Flip7 (Samsung.com Only)' } })).name, 'Galaxy Z Flip7')
  // «Z Flip 7» и «Z Flip7» склеиваются по основе артикула в import.mjs
  assert.equal(modelOf(gi({ Brand: 'Samsung', ProductFamily: { Value: 'Galaxy' }, ProductSeries: { Value: 'Z Flip 7' }, ProductName: 'SM-F766B' })).stem, 'SM-F766')
  assert.equal(modelOf(gi({ Brand: 'Samsung', ProductFamily: { Value: 'Galaxy' }, ProductSeries: { Value: 'Z Flip7' } })).slug, 'samsung-galaxy-z-flip7')
  assert.equal(modelOf(gi({ Brand: 'Honor', ProductName: '200 5G' })).slug, 'honor-200-5g')
})
