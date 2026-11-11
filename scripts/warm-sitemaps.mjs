// Прогрев карт сайта после загрузки: карты считаются по запросу, первый запрос к холодному кешу медленный.
// Обходим индекс и все файлы (по 6 параллельно), чтобы Googlebot всегда получал готовый ответ из кеша.
const SITE = process.env.SITE_URL ?? 'https://specvane.com'
const get = async (u) => { const t = Date.now(); const r = await fetch(u, { signal: AbortSignal.timeout(300_000) }); const x = await r.text(); return { status: r.status, n: (x.match(/<loc>/g) || []).length, ms: Date.now() - t, x } }
const idx = await get(`${SITE}/sitemap.xml`)
const files = [...idx.x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
console.log(`sitemap.xml: ${idx.status}, ${files.length} файлов, ${(idx.ms / 1000).toFixed(1)} с`)
let urls = 0, bad = 0, slow = []
const q = [...files]
await Promise.all(Array.from({ length: 6 }, async () => {
  while (q.length) {
    const f = q.shift()
    try { const r = await get(f); urls += r.n; if (r.status !== 200) bad++; slow.push([r.ms, f]) } catch (e) { bad++; console.log('ошибка', f, String(e)) }
  }
}))
slow.sort((a, b) => b[0] - a[0])
console.log(`адресов: ${urls}, ошибок: ${bad}; самые медленные: ${slow.slice(0, 5).map(([ms, f]) => `${f.split('/').pop()} ${(ms / 1000).toFixed(1)} с`).join(', ')}`)
