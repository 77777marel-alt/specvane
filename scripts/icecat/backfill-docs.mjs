// Догрузка документов (инструкция, брошюра, этикетка ЕС) для уже загруженных моделей.
// Берёт модели без docs_checked_at, у которых есть фото из Icecat (там лежит icecat_id), качает карточку и пишет ссылки.
// Запуск: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MAX_DOCS=6000, DEADLINE_SEC=1300
import { createClient } from '@supabase/supabase-js'
import { documents } from './map.mjs'

const env = (k, d) => process.env[k] ?? d
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
const MAX = Number(env('MAX_DOCS', '6000')), DEADLINE = Date.now() + Number(env('DEADLINE_SEC', '1300')) * 1000
const UA = 'SpecvaneBot/1.0 (+https://specvane.com)'
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

async function sheet(id) {
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(`https://live.icecat.biz/api?UserName=specvane&Language=en&icecat_id=${id}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) })
      if (r.ok) return (await r.json()).data
      if (r.status === 403 || r.status === 404) return null
    } catch { /* обрыв — повтор */ }
    await new Promise((res) => setTimeout(res, 1500 * a))
  }
  return null
}

let done = 0, withDocs = 0
while (done < MAX && Date.now() < DEADLINE) {
  const { data: rows, error } = await db.from('products').select('id, product_images(source, source_ref)').is('docs_checked_at', null).limit(200)
  if (error) { log('Ошибка:', error.message); break }
  if (!rows.length) { log('Все модели проверены'); break }
  const items = rows.map((r) => ({ id: r.id, icecat: (r.product_images ?? []).find((i) => i.source === 'icecat' && i.source_ref)?.source_ref ?? null }))
  let i = 0
  await Promise.all(Array.from({ length: 10 }, async () => {
    while (i < items.length) {
      const it = items[i++]
      const data = it.icecat ? await sheet(it.icecat) : null
      const docs = data ? documents(data).slice(0, 12) : []
      if (docs.length) {
        const { error: e } = await db.from('product_documents').upsert(docs.map((d) => ({ product_id: it.id, ...d })), { onConflict: 'product_id,url', ignoreDuplicates: true })
        if (!e) withDocs++
      }
      await db.from('products').update({ docs_checked_at: new Date().toISOString() }).eq('id', it.id)
      done++
    }
  }))
  log(`Проверено ${done}, с документами ${withDocs}`)
}
log('Готово:', { done, withDocs })
