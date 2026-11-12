import type { Locale } from './i18n/config'
import { MARKETS } from './i18n/config'
import type { SpecValue } from './types'
import en from '../../data/life/en.json'
import de from '../../data/life/de.json'
import fr from '../../data/life/fr.json'
import it from '../../data/life/it.json'
import es from '../../data/life/es.json'
import nl from '../../data/life/nl.json'
import pl from '../../data/life/pl.json'
import sv from '../../data/life/sv.json'
import ptbr from '../../data/life/pt-br.json'
import ja from '../../data/life/ja.json'
import tr from '../../data/life/tr.json'
import el from '../../data/life/el.json'
import cs from '../../data/life/cs.json'
import ro from '../../data/life/ro.json'
import da from '../../data/life/da.json'
import fi from '../../data/life/fi.json'
import nb from '../../data/life/nb.json'
import ru from '../../data/life/ru.json'
import uk from '../../data/life/uk.json'
import ar from '../../data/life/ar.json'

// «Цифры — в жизнь»: характеристики модели → понятные ориентиры (фото, часы видео, шум как бытовые звуки, дни работы…).
// Только арифметика по нашим данным и шаблоны data/life/<язык>.json — без генеративного текста (OCL Icecat §10).
type LifeText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, LifeText>
export const lifeText = (l: Locale): LifeText => T[l] ?? en

const fill = (s: string, m: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => m[k] ?? '')

export function lifeFacts(lang: Locale, cat: string, specs: SpecValue[]): string[] {
  const t = lifeText(lang)
  const nf = (x: number, d = 0) => new Intl.NumberFormat(MARKETS[lang]?.hreflang ?? lang, { maximumFractionDigits: d }).format(x)
  const round = (x: number) => (x >= 10000 ? Math.round(x / 1000) * 1000 : x >= 1000 ? Math.round(x / 100) * 100 : Math.round(x / 10) * 10)
  const get = (k: string) => specs.find((s) => s.key === k)
  const n = (k: string) => { const v = get(k)?.value; return typeof v === 'number' && v > 0 ? v : null }
  const disp = (k: string) => get(k)?.display ?? ''
  const out: string[] = []
  const add = (tpl: string, m: Record<string, string>) => out.push(fill(tpl, m))

  const gb = n('storage')
  if (gb && cat === 'game-consoles') { const k = Math.floor((gb * 0.85) / 80); if (k >= 1) add(t.storageGames, { gb: disp('storage'), n: nf(k) }) }
  else if (gb && gb >= 16) add(t.storage, { gb: disp('storage'), photos: nf(round((gb * 0.85 * 1000) / 3)), hours: nf((gb * 0.85) / 10.2, gb < 128 ? 1 : 0) })

  const mp = n('main_camera')
  if (mp && cat === 'smartphones') { const px = Math.sqrt((mp * 1e6 * 4) / 3); add(t.camera, { mp: disp('main_camera'), w: nf((px / 300) * 2.54), h: nf(((px * 3) / 4 / 300) * 2.54) }) }
  const zoom = n('optical_zoom')
  if (zoom && zoom >= 2) add(t.zoom, { x: disp('optical_zoom'), d: nf(30 / zoom, 1) })

  const nits = n('peak_brightness')
  if (nits && (cat === 'smartphones' || cat === 'tablets')) add(nits >= 1800 ? t.brightSun2 : nits >= 1000 ? t.brightSun : nits >= 600 ? t.brightMid : t.brightLow, { nits: disp('peak_brightness') })

  const hz = n('refresh_rate')
  if (hz && hz > 60) add(t.refresh, { hz: disp('refresh_rate'), ms: nf(1000 / hz, 1) })

  const db = n('noise')
  if (db && ['washing-machines', 'tumble-dryers', 'fridges', 'projectors', 'dishwashers'].includes(cat)) {
    const i = db <= 35 ? 0 : db <= 45 ? 1 : db <= 55 ? 2 : db <= 65 ? 3 : db <= 75 ? 4 : 5
    add(t.noise, { db: disp('noise'), like: t.noiseLike[i] })
  }

  const h = n('battery_life')
  if (h && cat === 'smartwatches' && h >= 24) add(t.battWatch, { h: disp('battery_life'), days: nf(h / 24, h < 72 ? 1 : 0) })
  if (h && (cat === 'headphones' || cat === 'speakers')) add(t.battAudio, { h: disp('battery_life'), days: nf(h / 2, 0) })
  if (h && cat === 'laptops' && h >= 4) add(t.battLaptop, { h: disp('battery_life'), days: nf(h / 8, 1) })
  const wh = n('battery_wh')
  if (wh && cat === 'laptops') add(wh <= 100 ? t.flightOk : t.flightAsk, { wh: disp('battery_wh') })
  const kgL = n('weight_kg')
  if (kgL && cat === 'laptops' && kgL >= 0.8) add(t.weight, { kg: disp('weight_kg'), n: nf(kgL, 1) })

  const people = (i: number) => t.people[Math.min(4, Math.max(0, i))]
  const kg = n('capacity_kg')
  if (kg && cat === 'washing-machines') add(t.wash, { kg: disp('capacity_kg'), people: people(kg <= 6 ? 0 : kg <= 7 ? 1 : kg <= 8 ? 2 : kg <= 9 ? 3 : 4), shirts: nf(Math.round(kg * 5)) })
  if (kg && cat === 'tumble-dryers') add(t.dry, { kg: disp('capacity_kg'), people: people(kg <= 6 ? 0 : kg <= 7 ? 1 : kg <= 8 ? 2 : kg <= 9 ? 3 : 4) })
  const wl = n('water_cycle')
  if (wl && cat === 'washing-machines') add(t.water, { l: disp('water_cycle'), b: nf(wl / 10, 1) })
  const fl = n('total_capacity')
  if (fl && cat === 'fridges') add(t.fridge, { l: disp('total_capacity'), people: people(fl <= 200 ? 0 : fl <= 280 ? 1 : fl <= 360 ? 2 : fl <= 450 ? 3 : 4) })
  const lamp = n('light_life')
  if (lamp && cat === 'projectors') add(t.lamp, { h: disp('light_life'), y: nf(lamp / 3 / 365, 1) })
  const beans = n('bean_capacity')
  if (beans && cat === 'coffee-machines') add(t.beans, { g: disp('bean_capacity'), n: nf(Math.floor(beans / 7)) })
  const tank = n('water_tank')
  if (tank && cat === 'coffee-machines') add(t.tank, { l: disp('water_tank'), n: nf(Math.floor((tank * 1000) / 40)) })
  const bar = n('pressure')
  if (bar && cat === 'coffee-machines' && bar > 9) add(t.pressure, { bar: disp('pressure') })
  const inch = n('display_size')
  if (inch && cat === 'tvs') add(t.tvDist, { in: disp('display_size'), a: nf((inch * 2.54 * 1.2) / 100, 1), b: nf((inch * 2.54 * 1.6) / 100, 1) })
  return out
}
