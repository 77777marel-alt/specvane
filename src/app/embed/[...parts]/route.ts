import { connection } from 'next/server'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getComparison, getCategory, getProduct } from '@/lib/catalog'
import { widgetsText } from '@/lib/widgets'
import { SITE_URL } from '@/lib/site'
import type { SpecValue } from '@/lib/types'

// Виджеты для чужих сайтов (iframe): /embed/<lang>/compare/<a-vs-b> и /embed/<lang>/p/<категория>/<модель>.
// Лёгкий HTML без скриптов; ссылка на Specvane внутри и (главное для SEO) — в коде вставки под iframe.
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function page(lang: string, title: string, body: string) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>${esc(title)}</title>
<style>:root{--bg:#fff;--fg:#0d1117;--mut:#5b6474;--line:#e5e8ee;--acc:#2f5bea;--good:#11845b;--goodbg:#e8f6ef}
@media (prefers-color-scheme:dark){:root{--bg:#0d0f13;--fg:#eef1f6;--mut:#9aa3b2;--line:#252a33;--acc:#7b9bff;--good:#4cc38a;--goodbg:#10291e}}
*{box-sizing:border-box}body{margin:0;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--fg)}
.w{padding:12px;border:1px solid var(--line);border-radius:14px;min-height:100vh}h1{font-size:16px;margin:0 0 8px}
table{width:100%;border-collapse:collapse}td,th{padding:6px 8px;border-top:1px solid var(--line);text-align:start;vertical-align:top}th{color:var(--mut);font-weight:500;font-size:12px}
.n{font-variant-numeric:tabular-nums}.g{background:var(--goodbg);color:var(--good);font-weight:600}.mut{color:var(--mut)}
.top{display:flex;gap:10px;align-items:center;margin-bottom:8px}.top img{width:64px;height:64px;object-fit:contain;border-radius:10px;background:#f4f6f9}
a.cta{display:inline-block;margin-top:10px;color:var(--acc);font-weight:600;text-decoration:none}.logo{display:inline-flex;width:16px;height:16px;border-radius:4px;background:var(--acc);color:#fff;font-size:12px;font-weight:700;align-items:center;justify-content:center;margin-inline-end:6px}</style>
</head><body><div class="w">${body}</div></body></html>`
}
const num = (s?: SpecValue) => (s && typeof s.value === 'number' ? s.value : null)
const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800', 'Content-Security-Policy': 'frame-ancestors *', 'X-Robots-Tag': 'noindex, follow' }

export async function GET(_req: Request, { params }: { params: Promise<{ parts: string[] }> }) {
  await connection()
  const { parts } = await params
  const [lang, kind, ...rest] = parts
  if (!isLocale(lang)) return new Response('Not found', { status: 404 })
  const L = lang as Locale, w = widgetsText(L)
  const utm = '?utm_source=widget&utm_medium=embed'

  if (kind === 'compare' && rest.length === 1) {
    const c = await getComparison(L, rest[0])
    if (!c || c.items.length !== 2) return new Response('Not found', { status: 404 })
    const [a, b] = c.items
    const all = (p: typeof a) => p.specGroups.flatMap((g) => g.specs)
    const keys = [...new Set([...a.keySpecs.map((x) => x.key), ...all(a).filter((x) => typeof x.value === 'number').map((x) => x.key)])]
    const rows = keys.map((k) => [all(a).find((x) => x.key === k), all(b).find((x) => x.key === k)] as const).filter(([x, y]) => x && y && x.display !== y.display).slice(0, 8)
    const tr = rows.map(([x, y]) => {
      const va = num(x), vb = num(y), hib = x!.higherIsBetter
      const wa = hib != null && va != null && vb != null && va !== vb && (hib ? va > vb : va < vb), wb = hib != null && va != null && vb != null && va !== vb && !wa
      return `<tr><th>${esc(x!.label)}</th><td class="n${wa ? ' g' : ''}">${esc(x!.display)}</td><td class="n${wb ? ' g' : ''}">${esc(y!.display)}</td></tr>`
    }).join('')
    const title = `${a.brand} ${a.name} vs ${b.brand} ${b.name}`
    const href = `${SITE_URL}${c.canonical}${utm}`
    const body = `<h1>${esc(title)}</h1><table><tr><th></th><th>${esc(`${a.brand} ${a.name}`)}</th><th>${esc(`${b.brand} ${b.name}`)}</th></tr>${tr}</table>
<a class="cta" href="${href}" target="_blank" rel="noopener"><span class="logo">+</span>${esc(w.fullCompare)} →</a>`
    return new Response(page(lang, title, body), { headers })
  }

  if (kind === 'p' && rest.length === 2) {
    const cat = await getCategory(L, rest[0])
    const p = cat && await getProduct(L, cat, rest[1])
    if (!cat || !p) return new Response('Not found', { status: 404 })
    const title = `${p.brand} ${p.name}`
    const specs = [...p.keySpecs, ...p.specGroups.flatMap((g) => g.specs).filter((x) => !p.keySpecs.some((k) => k.key === x.key))].slice(0, 8)
    const img = p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : ''
    const body = `<div class="top">${img}<div><div class="mut">${esc(cat.name)}</div><h1>${esc(title)}</h1></div></div>
<table>${specs.map((x) => `<tr><th>${esc(x.label)}</th><td class="n">${esc(x.display)}</td></tr>`).join('')}</table>
<a class="cta" href="${SITE_URL}${p.href}${utm}" target="_blank" rel="noopener"><span class="logo">+</span>${esc(w.fullSpecs)} →</a>`
    return new Response(page(lang, title, body), { headers })
  }
  return new Response('Not found', { status: 404 })
}
