// Маппинг карточки Open Icecat (live JSON API) → характеристики Specvane (категория smartphones).
// Чистые функции без сети — покрыты тестами (map.test.mjs).
// ВАЖНО (лицензия Open Icecat OCL §10): эти данные показываем как таблицу/фото, но НЕ передаём в генеративный ИИ.

/** Признаки Icecat по ID (глобальные) с запасным поиском по названию. */
const F = {
  displaySize: [944, /^display diagonal$/i],
  displayMarketing: [46952, /display technology marketing name/i],
  panelType: [15285, /^panel type$/i],
  resolution: [1585, /^display resolution$/i],
  refresh: [7450, /maximum refresh rate/i],
  brightness: [1389, /^display brightness$/i],
  cpuFamily: [2196, /^processor family$/i],
  cpuModel: [47, /^processor model$/i],
  cpuCores: [6089, /^processor cores$/i],
  ram: [7861, /^RAM capacity$/i],
  storage: [8730, /^internal storage capacity$/i],
  cardSlot: [null, /memory card slot|compatible memory cards|maximum memory card size/i],
  mainCam: [12435, /^rear camera resolution \(numeric\)$/i],
  opticalZoom: [74, /^optical zoom$/i],
  frontCam: [12437, /^front camera resolution \(numeric\)$/i],
  videoRes: [1597, /^video capture resolution \(max\)$/i],
  videoFps: [7515, /^maximum frame rate$/i],
  battery: [909, /^battery capacity$/i],
  wiredPower: [null, /^(fast )?charging power$|^maximum charging power$|^wired charging power$/i],
  wirelessPower: [null, /^wireless charging power$/i],
  weight: [94, /^weight$/i],
  depth: [1650, /^depth$/i],
  width: [1649, /^width$/i],
  height: [1464, /^height$/i],
  ip: [7900, /international protection \(ip\) code/i],
  network: [40629, /^mobile network generation$/i],
  simType: [9166, /^SIM card type$/i],
  nfc: [10157, /near field communication/i],
  wifi: [24993, /^top wi-fi standard$/i],
  bt: [1208, /^bluetooth version$/i],
  usbType: [1742, /^USB connector type$/i],
  usbVer: [8541, /^USB version$/i],
  headphone: [4163, /^headphone connectivity$/i],
  os: [3233, /^operating system installed$/i],
}

/** Все признаки карточки плоским списком: { id, name, raw, unit } */
export function flatFeatures(data) {
  const out = []
  for (const g of data?.FeaturesGroups ?? []) {
    for (const f of g.Features ?? []) {
      out.push({
        id: Number(f.Feature?.ID),
        name: String(f.Feature?.Name?.Value ?? ''),
        raw: f.RawValue == null ? '' : String(f.RawValue),
        unit: String(f.Feature?.Measure?.Signs?._ ?? f.Feature?.Measure?.Sign ?? ''),
      })
    }
  }
  return out
}

function pick(feats, [id, re]) {
  return feats.find((f) => id != null && f.id === id) ?? feats.find((f) => re.test(f.name)) ?? null
}
const num = (f) => {
  if (!f || f.raw === '') return null
  const n = Number(String(f.raw).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
const yn = (f) => (!f || f.raw === '' ? null : f.raw === 'Y' ? true : f.raw === 'N' ? false : null)
const txt = (f) => (f && f.raw.trim() ? f.raw.trim() : null)

/** Объём памяти в ГБ с учётом единицы (MB/TB). */
function gb(f) {
  const n = num(f)
  if (n == null) return null
  const u = f.unit.toUpperCase()
  if (u === 'MB') return Math.round((n / 1024) * 100) / 100
  if (u === 'TB') return n * 1024
  return n
}

const RES_NAMES = { '7680x4320': '8K', '3840x2160': '4K', '2560x1440': 'QHD', '1920x1080': 'Full HD', '1280x720': 'HD' }
function resolution(raw) {
  const m = /(\d+)\s*x\s*(\d+)/i.exec(raw ?? '')
  return m ? { w: +m[1], h: +m[2], text: `${m[1]} × ${m[2]}` } : null
}

/** Карточка Icecat → { key: value } для 30 характеристик смартфона (null = нет данных). */
export function mapSmartphone(data) {
  const fs = flatFeatures(data)
  const g = (k) => pick(fs, F[k])
  const s = {}

  s.display_size = num(g('displaySize'))
  s.display_type = txt(g('displayMarketing')) ?? txt(g('panelType'))
  s.display_resolution = resolution(txt(g('resolution')))?.text ?? null
  s.refresh_rate = num(g('refresh'))
  s.peak_brightness = num(g('brightness'))

  const fam = txt(g('cpuFamily'))
  const mdl = txt(g('cpuModel'))
  s.chipset = fam && mdl ? (mdl.toLowerCase().includes(fam.toLowerCase()) ? mdl : `${fam} ${mdl}`) : (mdl ?? fam)
  s.cpu_cores = num(g('cpuCores'))
  s.ram = gb(g('ram'))
  s.storage = gb(g('storage'))
  const card = g('cardSlot')
  s.expandable_storage = card ? (card.raw === 'N' ? false : true) : null

  s.main_camera = num(g('mainCam'))
  s.ultrawide_camera = null // Icecat не помечает, какая из задних камер — сверхширокая
  s.optical_zoom = num(g('opticalZoom'))
  s.front_camera = num(g('frontCam'))
  const vr = resolution(txt(g('videoRes')))
  const fps = num(g('videoFps'))
  s.video_max = vr ? `${RES_NAMES[`${vr.w}x${vr.h}`] ?? vr.text}${fps ? ` @ ${fps} fps` : ''}` : null

  s.battery = num(g('battery'))
  s.wired_charging = num(g('wiredPower'))
  s.wireless_charging = num(g('wirelessPower'))

  s.weight = num(g('weight'))
  s.thickness = num(g('depth'))
  s.width = num(g('width'))
  s.height = num(g('height'))
  s.ip_rating = txt(g('ip'))

  const net = txt(g('network'))
  s.five_g = net ? /5G/i.test(net) : null
  const sim = txt(g('simType'))
  s.esim = sim ? /eSIM/i.test(sim) : null
  s.nfc = yn(g('nfc'))
  s.wifi = txt(g('wifi'))
  s.bluetooth = txt(g('bt'))
  const ut = txt(g('usbType'))
  const uv = txt(g('usbVer'))
  s.usb = ut ? (uv ? `${ut} (${uv})` : ut) : null
  const hp = txt(g('headphone'))
  s.headphone_jack = hp ? /3\.5/.test(hp) : null
  s.os = txt(g('os'))
  s.os_updates = null // в Icecat нет; дополняем с официальных сайтов (шаг 5)

  // мусорные значения (0, отрицательные) считаем отсутствием
  for (const k of Object.keys(s)) if (typeof s[k] === 'number' && !(s[k] > 0)) s[k] = null
  return s
}

const slugify = (s) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const modelSlug = (brand, name) => slugify(`${brand} ${name}`)

/** Похоже на артикул, а не на название (SM-F766BDBGEUB, 6936520852376, MYEX3QL/A). */
export const isCode = (s) => {
  const t = String(s ?? '').trim()
  if (!t) return true
  if (/^\d{6,}$/.test(t)) return true
  return !/\s/.test(t) && t.length >= 7 && /\d/.test(t) && t === t.toUpperCase() && /[A-Z]/.test(t)
}
const clean = (s) => String(s ?? '').replace(/\bsmartphones?\b/gi, '').replace(/\s+/g, ' ').trim()

/** Убираем мусор продавцов из названия: «(Samsung.com Only)», «8/256GB AKILLI TELEFON MAVI», капслок. */
export function tidyName(s) {
  let t = clean(s)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+\s*(GB|TB)?\s*\/\s*\d+\s*(GB|TB)\b.*$/i, ' ')
    .replace(/\b\d+\s*(GB|TB)\b.*$/i, ' ')
    .replace(/\s+\d{2,}(-\d+){2,}\s*$/, ' ')   // хвост-артикул «40-45-5590»
    .replace(/\s+/g, ' ').trim()
  if (t && t === t.toUpperCase() && /[A-Z]{4,}/.test(t)) {
    // КАПСЛОК → «Galaxy A27 5G»: слова с цифрами и короткие аббревиатуры оставляем как есть
    t = t.split(' ').map((w) => (/\d/.test(w) || w.length <= 3 ? w : w[0] + w.slice(1).toLowerCase())).join(' ')
  }
  return t
}

/** Семейства по умолчанию, если Icecat не указал (Samsung «S25 FE» → «Galaxy S25 FE»). */
const DEFAULT_FAMILY = {
  samsung: [/^(S|A|Z|M|F|XCover)\s?\d/i, 'Galaxy'],
  apple: [/^\d/, 'iPhone'],
  google: [/^\d/, 'Pixel'],
}

/** Основа артикула модели — по ней склеиваем SKU без названия (Samsung SM-F766B… → SM-F766). */
export function codeStem(brandSlug, ...codes) {
  for (const c of codes) {
    const t = String(c ?? '').toUpperCase()
    if (brandSlug === 'samsung') { const m = /^(SM-[A-Z]\d{3})/.exec(t); if (m) return m[1] }
  }
  return null
}

/**
 * Модель (одна карточка на сайте) из SKU Icecat: семейство + серия/название («Galaxy» + «S22»).
 * Цвет/память/артикул — варианты одной модели. Если названия нет (только артикул) — name=null,
 * тогда импорт пробует найти модель по основе артикула (stem).
 */
export function modelOf(data, { families = true } = {}) {
  const gi = data.GeneralInfo ?? {}
  const brand = clean(gi.Brand)
  if (!brand) return null
  const brandSlug = slugify(brand)
  let family = tidyName(gi.ProductFamily?.Value)
  const series = clean(gi.ProductSeries?.Value)
  const pname = clean(gi.ProductName)
  let base = tidyName([series, pname].find((x) => x && !isCode(x)) ?? '')
  if (base && family && base.toLowerCase().startsWith(family.toLowerCase())) family = ''
  if (base && !family && families) {
    const d = DEFAULT_FAMILY[brandSlug]
    if (d && d[0].test(base)) family = d[1]
  }
  if (base.toLowerCase().startsWith(brand.toLowerCase() + ' ')) base = base.slice(brand.length + 1)
  const name = base ? clean([family, base].filter(Boolean).join(' ')) : null
  const stem = codeStem(brandSlug, gi.ProductName, gi.BrandPartCode)
  return { brand, brandSlug, name, slug: name ? modelSlug(brand, name) : null, stem }
}

/** ДД-ММ-ГГГГ → ГГГГ-ММ-ДД */
export function releaseDate(data) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(data.GeneralInfo?.ReleaseDate ?? ''))
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

export function images(data, max = 6) {
  return (data.Gallery ?? [])
    .map((g) => g.Pic500x500 || g.Pic || null)
    .filter((u) => typeof u === 'string' && u.startsWith('https://'))
    .slice(0, max)
}

export function gtins(data) {
  return (data.GeneralInfo?.GTIN ?? []).map(String).filter((g) => /^\d{8,14}$/.test(g))
}

export { slugify }
