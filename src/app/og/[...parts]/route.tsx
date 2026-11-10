import { ImageResponse } from 'next/og'
import { isLocale } from '@/lib/i18n/config'
import { getComparison, getCategory, getProduct, getBrandVs, getCategoryByKey } from '@/lib/catalog'
import { brandsText } from '@/lib/brands'
import { guideFor, GUIDE_UI } from '@/lib/guides'
import { APPLIANCES, applianceName, errorCode, type Appliance } from '@/lib/errors'
import { getDict } from '@/lib/i18n'
import { fill } from '@/lib/format'
import type { Locale } from '@/lib/i18n/config'
import type { SpecValue } from '@/lib/types'

// Картинки-превью для ссылок (Telegram, WhatsApp, Facebook, X): /og/<lang>/compare/<a-vs-b>.png и /og/<lang>/p/<cat>/<slug>.png
const W = 1200, H = 630
const ACCENT = '#2f5bea', GOOD = '#11845b'

function frame(children: React.ReactNode) {
  return (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', background: '#ffffff', padding: 56, fontFamily: 'Noto Sans, Noto Sans JP, Noto Sans Arabic' }}>
      {children}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color: '#5b6474' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 700 }}>+</div>
        specvane.com
      </div>
    </div>
  )
}

// Шрифты: Noto из Google Fonts только с нужными буквами (кириллица, греческий, японский, арабский иначе не рисуются).
async function font(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`, { signal: AbortSignal.timeout(4000) })).text()
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
    return url ? await (await fetch(url, { signal: AbortSignal.timeout(6000) })).arrayBuffer() : null
  } catch { return null }
}
async function fonts(lang: string, text: string) {
  const fam = lang === 'ja' ? 'Noto Sans JP' : lang === 'ar' ? 'Noto Sans Arabic' : 'Noto Sans'
  const t = text + 'specvane.com+0123456789'
  const list = await Promise.all([[fam, 400], [fam, 700], ...(fam !== 'Noto Sans' ? [['Noto Sans', 400], ['Noto Sans', 700]] : [])].map(async ([f, w]) => {
    const data = await font(f as string, w as number, t)
    return data ? { name: f as string, data, weight: w as 400 | 700, style: 'normal' as const } : null
  }))
  return list.filter((x) => !!x)
}
const opts = async (lang: string, text: string) => { const f = await fonts(lang, text); return { width: W, height: H, ...(f.length ? { fonts: f } : {}), headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } } }
const textOf = (x: unknown): string => typeof x === 'string' ? x : Array.isArray(x) ? x.map(textOf).join(' ') : x && typeof x === 'object' && 'props' in (x as object) ? textOf((x as { props: { children?: unknown } }).props.children) : ''

const num = (s: SpecValue | undefined) => (s && typeof s.value === 'number' ? s.value : null)

export async function GET(_req: Request, { params }: { params: Promise<{ parts: string[] }> }) {
  const { parts } = await params
  const [lang, kind, ...rest] = parts
  const last = (rest.at(-1) ?? '').replace(/\.png$/, '')
  if (!isLocale(lang)) return new Response('Not found', { status: 404 })

  if (kind === 'compare') {
    const c = await getComparison(lang, last)
    if (!c) return new Response('Not found', { status: 404 })
    const [a, b] = c.items
    const all = (p: typeof a) => p.specGroups.flatMap((g) => g.specs)
    // до 4 строк, где разница больше всего
    const rows = all(a).flatMap((x) => {
      const y = all(b).find((z) => z.key === x.key)
      const va = num(x), vb = num(y)
      if (!y || va == null || vb == null || !(va > 0 && vb > 0) || x.higherIsBetter == null || x.display === y.display) return []
      return [{ label: x.label, a: x.display, b: y.display, d: Math.abs(Math.log(vb / va)), win: (x.higherIsBetter ? va > vb : va < vb) ? 0 : 1 }]
    }).sort((p, q) => q.d - p.d).slice(0, 4)
    const el = frame(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: '#0d1117', lineHeight: 1.1 }}>{`${a.brand} ${a.name}`}</div>
        <div style={{ display: 'flex', fontSize: 34, color: '#5b6474' }}>vs</div>
        <div style={{ display: 'flex', fontSize: 54, fontWeight: 700, color: '#0d1117', lineHeight: 1.1 }}>{`${b.brand} ${b.name}`}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', fontSize: 30, gap: 18 }}>
              <div style={{ display: 'flex', width: 420, color: '#5b6474' }}>{r.label}</div>
              <div style={{ display: 'flex', width: 260, color: r.win === 0 ? GOOD : '#0d1117', fontWeight: r.win === 0 ? 700 : 400 }}>{r.a}</div>
              <div style={{ display: 'flex', width: 260, color: r.win === 1 ? GOOD : '#0d1117', fontWeight: r.win === 1 ? 700 : 400 }}>{r.b}</div>
            </div>
          ))}
        </div>
      </div>,
    )
    return new ImageResponse(el, await opts(lang, textOf(el)))
  }

  if (kind === 'p' && rest.length === 2) {
    const cat = await getCategory(lang, rest[0])
    const p = cat && await getProduct(lang, cat, last)
    if (!cat || !p) return new Response('Not found', { status: 404 })
    const el = frame(
      <div style={{ display: 'flex', gap: 40 }}>
        {p.image
          ? <img src={p.image} width={380} height={380} style={{ objectFit: 'contain', borderRadius: 24, background: '#f4f6f9' }} alt="" />
          : <div style={{ width: 380, height: 380, borderRadius: 24, background: '#f4f6f9', display: 'flex' }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <div style={{ display: 'flex', fontSize: 28, color: '#5b6474' }}>{`${p.brand} · ${cat.name}`}</div>
          <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, color: '#0d1117', lineHeight: 1.1 }}>{p.name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            {p.keySpecs.slice(0, 5).map((k) => (
              <div key={k.key} style={{ display: 'flex', fontSize: 28, padding: '8px 16px', borderRadius: 12, background: '#eef2fb', color: '#0d1117' }}>{k.display}</div>
            ))}
          </div>
        </div>
      </div>,
    )
    return new ImageResponse(el, await opts(lang, textOf(el)))
  }

  const L = lang as Locale
  const title = (t: string, sub?: string, extra?: React.ReactNode) => frame(
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {sub && <div style={{ display: 'flex', fontSize: 30, color: '#5b6474' }}>{sub}</div>}
      <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, color: '#0d1117', lineHeight: 1.12 }}>{t}</div>
      {extra}
    </div>,
  )

  // бренд против бренда: /og/<lang>/brands/<категория>/<a-vs-b>.png
  if (kind === 'brands' && rest.length === 2) {
    const cat = await getCategory(L, rest[0])
    const m = last.match(/^(.+?)-vs-(.+)$/)
    const v = cat && m ? await getBrandVs(L, cat, m[1], m[2]) : null
    if (!cat || !v) return new Response('Not found', { status: 404 })
    const bt = brandsText(L)
    const sum = v.wa === v.wb ? fill(bt.tie, { a: v.a.name, b: v.b.name, n: v.wa }) : fill(bt.ahead, { brand: v.wa > v.wb ? v.a.name : v.b.name, n: Math.max(v.wa, v.wb), m: v.both })
    const el = title(`${v.a.name} vs ${v.b.name}`, cat.name, <div style={{ display: 'flex', fontSize: 38, color: GOOD, fontWeight: 700 }}>{sum}</div>)
    return new ImageResponse(el, await opts(lang, textOf(el)))
  }

  // гид: /og/<lang>/guide/<ключ категории>.png
  if (kind === 'guide' && rest.length === 1) {
    const g = guideFor(L, last)
    if (!g) return new Response('Not found', { status: 404 })
    const el = title(g.title, GUIDE_UI[L].one, (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {g.checklist.slice(0, 3).map((c) => <div key={c} style={{ display: 'flex', fontSize: 28, color: '#0d1117' }}>{`• ${c.length > 70 ? c.slice(0, 68) + '…' : c}`}</div>)}
      </div>
    ))
    return new ImageResponse(el, await opts(lang, textOf(el)))
  }

  // код ошибки: /og/<lang>/error/<ключ техники>/<бренд>/<код>.png
  if (kind === 'error' && rest.length === 3 && rest[0] in APPLIANCES) {
    const ap = rest[0] as Appliance
    const r = errorCode(L, ap, rest[1], last)
    if (!r) return new Response('Not found', { status: 404 })
    const t = getDict(L)
    const sub = `${r.item.brand} · ${(await getCategoryByKey(L, ap))?.name ?? applianceName(L, ap).many}`
    const el = title(r.item.title, sub, <div style={{ display: 'flex', fontSize: 120, fontWeight: 700, color: ACCENT, lineHeight: 1 }}>{r.item.code}</div>)
    void t
    return new ImageResponse(el, await opts(lang, textOf(el)))
  }
  return new Response('Not found', { status: 404 })
}
