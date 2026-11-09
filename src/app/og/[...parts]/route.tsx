import { ImageResponse } from 'next/og'
import { isLocale } from '@/lib/i18n/config'
import { getComparison, getCategory, getProduct } from '@/lib/catalog'
import type { SpecValue } from '@/lib/types'

// Картинки-превью для ссылок (Telegram, WhatsApp, Facebook, X): /og/<lang>/compare/<a-vs-b>.png и /og/<lang>/p/<cat>/<slug>.png
const W = 1200, H = 630
const ACCENT = '#2f5bea', GOOD = '#11845b'

function frame(children: React.ReactNode) {
  return (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', background: '#ffffff', padding: 56, fontFamily: 'Geist' }}>
      {children}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color: '#5b6474' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 700 }}>+</div>
        specvane.com
      </div>
    </div>
  )
}

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
    return new ImageResponse(frame(
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
    ), { width: W, height: H, headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } })
  }

  if (kind === 'p' && rest.length === 2) {
    const cat = await getCategory(lang, rest[0])
    const p = cat && await getProduct(lang, cat, last)
    if (!cat || !p) return new Response('Not found', { status: 404 })
    return new ImageResponse(frame(
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
    ), { width: W, height: H, headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } })
  }
  return new Response('Not found', { status: 404 })
}
