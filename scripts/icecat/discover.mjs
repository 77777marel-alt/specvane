// Разведка всех категорий Open Icecat: сколько позиций, как называются, какая доля открыта.
// Результат → таблица icecat_categories. Дальше выбираем категории (selected) и запускаем auto-setup.mjs.
import { createClient } from '@supabase/supabase-js'
import { createGunzip } from 'node:zlib'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'

const env = (k, d) => process.env[k] ?? d
const UA = 'SpecvaneImporter/1.0 (+https://specvane.com)'
const TOP = Number(env('TOP', '700'))
const MIN = Number(env('MIN_SKUS', '150'))
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data }

const res = await fetch('https://data.icecat.biz/export/freexml/EN/on_market.index.csv.gz', { headers: { 'Api-Token': env('ICECAT_API_TOKEN'), 'User-Agent': UA } })
if (!res.ok) throw new Error(`Индекс: HTTP ${res.status}`)
const rl = createInterface({ input: Readable.fromWeb(res.body).pipe(createGunzip()), crlfDelay: Infinity })
let head = null
const cats = new Map() // catid → { n, ids: [[updated, id]] }
for await (const line of rl) {
  const c = line.split('\t')
  if (!head) { head = Object.fromEntries(c.map((x, i) => [x.trim().toLowerCase(), i])); continue }
  if ((c[head.quality] ?? '').toUpperCase() === 'REMOVED') continue
  if (head.limited != null && /^(1|y|yes|true)$/i.test((c[head.limited] ?? '').trim())) continue
  const cat = c[head.catid]; if (!cat) continue
  let e = cats.get(cat); if (!e) cats.set(cat, (e = { n: 0, ids: [] }))
  e.n++
  e.ids.push([c[head.updated] ?? '', c[head.product_id]])
  if (e.ids.length > 400) { e.ids.sort((a, b) => (a[0] < b[0] ? 1 : -1)); e.ids.length = 60 }
}
const top = [...cats].filter(([, e]) => e.n >= MIN).sort((a, b) => b[1].n - a[1].n).slice(0, TOP)
log(`Категорий в индексе: ${cats.size}, берём ${top.length} (от ${MIN} позиций)`)

async function sheet(id) {
  try {
    const r = await fetch(`https://live.icecat.biz/api?UserName=specvane&Language=en&icecat_id=${id}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
    return r.ok ? (await r.json()).data : null
  } catch { return null }
}
async function pool(items, n, fn) {
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await fn(items[i++]) }))
}

const rows = []
await pool(top, 12, async ([catid, e]) => {
  const ids = e.ids.sort((a, b) => (a[0] < b[0] ? 1 : -1)).map((x) => x[1])
  const probe = ids.slice(0, 6)
  let open = 0, name = null
  for (const id of probe) {
    const d = await sheet(id)
    if (d) { open++; name ??= d.GeneralInfo?.Category?.Name?.Value ?? null }
  }
  rows.push({ catid, name_en: name, sku_count: e.n, sample_ids: ids.slice(0, 60), open_share: probe.length ? open / probe.length : 0,
    checked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
})
for (let i = 0; i < rows.length; i += 200) must(await db.from('icecat_categories').upsert(rows.slice(i, i + 200), { onConflict: 'catid' }), 'upsert')
rows.sort((a, b) => b.sku_count - a.sku_count)
for (const r of rows) log(r.catid.padStart(5), String(r.sku_count).padStart(7), `${Math.round(r.open_share * 100)}%`.padStart(5), r.name_en ?? '—')
