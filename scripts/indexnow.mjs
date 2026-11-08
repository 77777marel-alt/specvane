#!/usr/bin/env node
// IndexNow (Bing, Yandex, Seznam, Naver…): сообщаем о новых/изменённых страницах после ночного импорта.
// Ключ публичный по протоколу: файл https://specvane.com/b9e2507c5ebe16970ccfb811741a9efa.txt
import { createClient } from '@supabase/supabase-js'

const KEY = 'b9e2507c5ebe16970ccfb811741a9efa'
const HOST = 'specvane.com'
const SINCE_H = Number(process.env.INDEXNOW_SINCE_HOURS ?? '30')
const LANGS = ['en', 'de', 'fr', 'it', 'es', 'nl', 'pl', 'sv', 'pt-br', 'ja']
const COMPARE = { en: 'compare', de: 'vergleich', fr: 'comparatif', it: 'confronto', es: 'comparativa', nl: 'vergelijken', pl: 'porownanie', sv: 'jamforelse', 'pt-br': 'comparacao', ja: 'compare' }

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const since = new Date(Date.now() - SINCE_H * 3600e3).toISOString()

async function all(q) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await q().range(from, from + 999)
    if (error) throw error
    out.push(...data)
    if (data.length < 1000) break
  }
  return out
}

const cats = await all(() => db.from('category_i18n').select('lang, slug, category_id'))
const catSlug = (id, l) => cats.find((c) => c.category_id === id && c.lang === l)?.slug
const products = await all(() => db.from('products').select('slug, category_id').eq('status', 'active').eq('is_indexable', true).gte('updated_at', since))
const comps = await all(() => db.from('comparisons').select('a:products!comparisons_product_a_fkey(slug), b:products!comparisons_product_b_fkey(slug)').eq('is_indexable', true).gte('updated_at', since))

const urls = []
for (const l of LANGS) {
  for (const p of products) { const c = catSlug(p.category_id, l); if (c) urls.push(`https://${HOST}/${l}/${c}/${p.slug}`) }
  for (const c of comps) urls.push(`https://${HOST}/${l}/${COMPARE[l]}/${c.a.slug}-vs-${c.b.slug}`)
}
console.log(`Новых/изменённых: моделей ${products.length}, сравнений ${comps.length} → адресов ${urls.length}`)
for (let i = 0; i < urls.length; i += 10000) {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(i, i + 10000) }),
  })
  console.log(`IndexNow пачка ${i / 10000 + 1}: HTTP ${r.status}`)
}
