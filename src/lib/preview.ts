// Демо-данные ТОЛЬКО для страницы предпросмотра дизайна (/[lang]/design-preview, noindex).
// Модели и магазины вымышленные. На реальных страницах данные приходят из базы.
import 'server-only'
import { MARKETS, type Locale } from './i18n/config'
import { number } from './format'
import type { ProductCardData, ProductView, SpecGroup, SpecValue } from './types'

const FX: Record<string, number> = { EUR: 1, USD: 1.08, PLN: 4.3, SEK: 11.4, BRL: 6.1, JPY: 165 }
const de = (l: Locale) => l === 'de'

type Raw = { key: string; en: string; de: string; v: number | boolean | string; unit?: string; hib?: boolean | null; group: 'img' | 'light' | 'sound' | 'body' }
const GROUPS = { img: ['Image', 'Bild'], light: ['Light source', 'Lichtquelle'], sound: ['Sound & connections', 'Ton & Anschlüsse'], body: ['Size & weight', 'Abmessungen & Gewicht'] }

const MODELS = [
  { slug: 'demo-beam-x1', name: 'Beam X1', price: 1290, release: '2026-03-12',
    raw: [['brightness', 3000], ['resolution', '3840 × 2160'], ['contrast', 2000000], ['hdr', true], ['input_lag', 16], ['light', 'Laser'], ['life', 25000], ['noise', 28], ['speakers', 20], ['hdmi', 3], ['weight', 7.2]] },
  { slug: 'demo-cine-l2', name: 'Cine L2', price: 1490, release: '2025-10-02',
    raw: [['brightness', 2500], ['resolution', '3840 × 2160'], ['contrast', 3000000], ['hdr', true], ['input_lag', 21], ['light', 'Laser'], ['life', 30000], ['noise', 24], ['speakers', 10], ['hdmi', 2], ['weight', 8.4]] },
  { slug: 'demo-go-mini', name: 'Go Mini', price: 549, release: '2026-01-20',
    raw: [['brightness', 1200], ['resolution', '1920 × 1080'], ['contrast', 400000], ['hdr', false], ['input_lag', 33], ['light', 'LED'], ['life', 20000], ['noise', 30], ['speakers', 8], ['hdmi', 1], ['weight', 1.6]] },
] as const

const DEFS: Record<string, Omit<Raw, 'v' | 'key'>> = {
  brightness: { en: 'Brightness', de: 'Helligkeit', unit: 'lm', hib: true, group: 'img' },
  resolution: { en: 'Resolution', de: 'Auflösung', hib: null, group: 'img' },
  contrast: { en: 'Contrast', de: 'Kontrast', unit: ':1', hib: true, group: 'img' },
  hdr: { en: 'HDR', de: 'HDR', hib: true, group: 'img' },
  input_lag: { en: 'Input lag', de: 'Input-Lag', unit: 'ms', hib: false, group: 'img' },
  light: { en: 'Light source', de: 'Lichtquelle', hib: null, group: 'light' },
  life: { en: 'Light source life', de: 'Lebensdauer Lichtquelle', unit: 'h', hib: true, group: 'light' },
  noise: { en: 'Noise level', de: 'Lautstärke', unit: 'dB', hib: false, group: 'light' },
  speakers: { en: 'Speakers', de: 'Lautsprecher', unit: 'W', hib: true, group: 'sound' },
  hdmi: { en: 'HDMI inputs', de: 'HDMI-Eingänge', hib: true, group: 'sound' },
  weight: { en: 'Weight', de: 'Gewicht', unit: 'kg', hib: false, group: 'body' },
}

function spec(l: Locale, key: string, v: number | boolean | string, yes: string, no: string): SpecValue {
  const d = DEFS[key]
  let display: string
  if (typeof v === 'boolean') display = v ? yes : no
  else if (typeof v === 'number') display = d.unit === ':1' ? `${number(l, v)}:1` : `${number(l, v, 1)}${d.unit ? ' ' + d.unit : ''}`
  else display = v
  return { key, label: de(l) ? d.de : d.en, value: v, display, higherIsBetter: d.hib }
}

const TEXT = {
  en: [
    { who: 'Bright living rooms and gaming on a big screen.', verdict: 'The brightest of the three and the lowest input lag — a strong pick for rooms you can’t fully darken.', pros: ['3000 lm — the brightest in this comparison', 'Lowest input lag (16 ms)', 'Three HDMI inputs'], cons: ['Louder than Cine L2 (28 dB)', 'Heavier than portable models'] },
    { who: 'Dark home cinemas where contrast matters most.', verdict: 'Best contrast and the quietest fan — made for movie nights in a dark room.', pros: ['Highest contrast (3 000 000:1)', 'Quietest (24 dB)', 'Longest light source life'], cons: ['Less bright than Beam X1', 'Highest price of the three'] },
    { who: 'Portable use, small rooms and tight budgets.', verdict: 'Light and affordable, but only Full HD and without HDR.', pros: ['Only 1.6 kg', 'Lowest price'], cons: ['Full HD, no HDR', 'Least bright (1200 lm)'] },
  ],
  de: [
    { who: 'Helle Wohnzimmer und Gaming auf großer Leinwand.', verdict: 'Der hellste der drei mit dem geringsten Input-Lag — stark für Räume, die sich nicht ganz abdunkeln lassen.', pros: ['3000 lm — der hellste im Vergleich', 'Geringster Input-Lag (16 ms)', 'Drei HDMI-Eingänge'], cons: ['Lauter als Cine L2 (28 dB)', 'Schwerer als mobile Modelle'] },
    { who: 'Dunkle Heimkinos, in denen Kontrast zählt.', verdict: 'Bester Kontrast und leisester Lüfter — gemacht für Filmabende im dunklen Raum.', pros: ['Höchster Kontrast (3.000.000:1)', 'Am leisesten (24 dB)', 'Längste Lebensdauer der Lichtquelle'], cons: ['Weniger hell als Beam X1', 'Höchster Preis der drei'] },
    { who: 'Mobil, kleine Räume und kleines Budget.', verdict: 'Leicht und günstig, aber nur Full HD und ohne HDR.', pros: ['Nur 1,6 kg', 'Niedrigster Preis'], cons: ['Full HD, kein HDR', 'Am wenigsten hell (1200 lm)'] },
  ],
}
const CHOOSE = {
  en: [['your room is bright or you play games', 'you want three HDMI inputs'], ['you watch films in a dark room', 'a quiet fan matters to you']],
  de: [['Ihr Raum hell ist oder Sie spielen', 'Sie drei HDMI-Eingänge brauchen'], ['Sie Filme im dunklen Raum schauen', 'ein leiser Lüfter wichtig ist']],
}
export const CHIPS = {
  en: ['All', 'For bright rooms', 'For gaming', 'Home cinema', 'Quiet', 'Portable', 'Under 1,000'],
  de: ['Alle', 'Für helle Räume', 'Zum Zocken', 'Heimkino', 'Leise', 'Tragbar', 'Unter 1.000 €'],
}
export const tx = <T,>(l: Locale, o: { en: T; de: T }) => (de(l) ? o.de : o.en)

export function previewProducts(l: Locale, yes: string, no: string, base: string): ProductView[] {
  const cur = MARKETS[l].currency
  const k = FX[cur] ?? 1
  const round = (v: number) => (cur === 'JPY' ? Math.round(v / 100) * 100 : Math.round(v / 10) * 10 - 1)
  const texts = tx(l, TEXT)
  const cards: ProductCardData[] = []
  const views = MODELS.map((m, idx) => {
    const specs = m.raw.map(([key, v]) => spec(l, key, v as number | boolean | string, yes, no))
    const groups: SpecGroup[] = (Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => ({
      name: de(l) ? GROUPS[g][1] : GROUPS[g][0],
      specs: specs.filter((s) => DEFS[s.key].group === g),
    }))
    const price = round(m.price * k)
    const hist = Array.from({ length: 90 }, (_, i) => {
      const wave = Math.sin(i / 9 + idx) * 0.05 + (i < 40 ? 0.08 : 0) - (i > 75 ? 0.03 : 0)
      const d = new Date(Date.UTC(2026, 7, 10 + i))
      return { day: d.toISOString().slice(0, 10), price: round(m.price * k * (1 + wave)) }
    })
    hist[hist.length - 1].price = price
    const key = (n: string) => specs.find((s) => s.key === n)!
    const card: ProductCardData = {
      slug: m.slug, href: `${base}`, name: m.name, brand: 'Demo', image: null, price, currency: cur,
      keySpecs: [key('brightness'), key('resolution'), key('contrast'), key('noise'), key('input_lag')], verdict: texts[idx].who,
    }
    cards.push(card)
    return {
      ...card, verdict: texts[idx].verdict, whoFor: texts[idx].who, pros: texts[idx].pros, cons: texts[idx].cons,
      category: { name: de(l) ? 'Beamer' : 'Projectors', href: base + '/category' },
      releaseDate: m.release, specGroups: groups, updatedAt: '2026-11-08',
      offers: [
        { shop: 'Shop A', price, currency: cur, url: '#', inStock: true, updatedAt: '2026-11-08' },
        { shop: 'Shop B', price: round(m.price * k * 1.04), currency: cur, url: '#', inStock: true, updatedAt: '2026-11-08' },
        { shop: 'Shop C', price: round(m.price * k * 1.09), currency: cur, url: '#', inStock: false, updatedAt: '2026-11-07' },
      ],
      priceHistory: hist, alternatives: [] as ProductCardData[],
    } satisfies ProductView
  })
  views[0].alternatives = cards.slice(1)
  return views
}
export const previewChooseIf = (l: Locale) => tx(l, CHOOSE)
