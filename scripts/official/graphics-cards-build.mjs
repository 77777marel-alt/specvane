// Сборка data/official/graphics-cards.json из официальных данных производителей видеочипов:
//   data/official/raw/nvidia-geforce.json — страница сравнения nvidia.com/en-us/geforce/graphics-cards/compare/
//                                           (эталонные характеристики, GTX 16 — RTX 50, настольные)
//   data/official/raw/amd-radeon.json      — таблица amd.com Graphics Specifications (Radeon RX 400 — RX 9000)
//   data/official/raw/intel-arc.json       — страницы Intel ARK (Arc A, Arc B, Arc Pro)
// Только факты производителя, без оценок «сильнее/слабее» (решение Максима 26.11.2026).
// Если производитель даёт два объёма памяти (RTX 4060 Ti: 16 GB или 8 GB) — это две модели.
// Ключи — характеристики категории graphics-cards (scripts/icecat/categories.mjs).
// Запуск: node scripts/official/graphics-cards-build.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const here = (p) => new URL(p, import.meta.url)
const load = (f) => JSON.parse(readFileSync(here(`../../data/official/raw/${f}`), 'utf8'))
const nv = load('nvidia-geforce.json'), amd = load('amd-radeon.json'), arc = load('intel-arc.json')

const num = (s) => { const m = String(s ?? '').replace(',', '.').match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null }
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== '' && !(typeof v === 'number' && !Number.isFinite(v))))
const QM = { 1: '01', 2: '04', 3: '07', 4: '10' }
const out = []
const seen = new Set()
const push = (p) => { const k = `${p.brand} ${p.name}`.toLowerCase(); if (seen.has(k)) return; seen.add(k); out.push(p) }

// ---------- NVIDIA ----------
// «16 GB / 8 GB GDDR7» — тип указан один раз в конце; «12 GB GDDR6 / 12 GB GDDR6X» — у каждого свой
const memOpts = (s) => {
  const parts = String(s ?? '').split(/\s*\/\s*|\s+or\s+/i)
  const last = parts.map((x) => x.match(/GDDR\w+/i)?.[0]).filter(Boolean).pop()
  return parts.map((x) => { const m = x.match(/(\d+)\s*GB/i); return m ? { gb: Number(m[1]), type: (x.match(/GDDR\w+/i)?.[0] ?? last ?? '').toUpperCase() || null } : null }).filter(Boolean)
}
const pick = (o, re) => { const k = Object.keys(o).find((x) => re.test(x)); return k ? o[k] : undefined }
for (const x of nv) {
  // GTX 1650 (G5)/(G6) — версии с памятью GDDR5 и GDDR6
  const gddr = x.name.match(/\((G[56])\)$/)?.[1]
  const base = x.name.replace(/\s*\((G5|G6)\)$/, '').replace(/\s*\((\d+) GB\)$/, '')
  const variantInName = /\((\d+) GB\)$/.test(x.name) // RTX 3050 (8 GB) / (6 GB): у NVIDIA это отдельные колонки
  const mems = memOpts(x['Standard Memory Config'])
  const buses = String(x['Memory Interface Width'] ?? '').split(/\s*\/\s*/).map(num)
  const boostKey = Object.keys(x).find((k) => /^Boost Clock/.test(k))
  const boostMhz = boostKey ? (/GHz/.test(boostKey) ? Math.round(num(x[boostKey]) * 1000) : num(x[boostKey])) : null
  const gen = x['PCI Express'] ? num(x['PCI Express']) : num(Object.keys(x).find((k) => /^PCI Express Gen \d/.test(k) && /^yes/i.test(x[k])))
  const dxKey = Object.keys(x).find((k) => /DirectX|DX12/.test(k) && /^yes/i.test(x[k]))
  const dx = dxKey ? (/Ultimate/.test(dxKey) ? '12 Ultimate' : (dxKey.match(/DirectX®?\s*([\d.]+)/)?.[1] ?? null)) : null
  const disp = x['Multi Monitor'] ? (String(x['Multi Monitor']).match(/^(?:up to\s*)?(\d+)/i)?.[1] ?? null) : null
  const hdmi = String(x['Standard Display Connectors'] ?? '').match(/HDMI\s+([\d.]+[a-z]?)/i)?.[1] ?? null
  const len = String(x['Length'] ?? '').match(/(\d+)\s*mm/)?.[1]
  const psu = num(pick(x, /^(Required|Minimum) System Power/))
  const conn = pick(x, /^(Required|Supplementary) Power Connectors/)
  const variants = mems.length > 1 && !variantInName ? mems : [mems[0]]
  variants.forEach((m, i) => {
    const sameSize = variants.length > 1 && variants.every((v) => v?.gb === variants[0]?.gb)
    const suffix = variants.length > 1 ? (sameSize ? ` (${m.type})` : ` (${m.gb} GB)`) : variantInName ? x.name.match(/\s\((\d+ GB)\)$/)[0] : gddr ? ` (GDDR${gddr[1]})` : ''
    push({ brand: 'NVIDIA', name: `${base}${suffix}`, release_date: null, source_url: x.source_url,
      specs: clean({
        gpu_chip: base, gpu_brand: 'NVIDIA',
        vram: m?.gb ?? null, vram_type: m?.type ?? null,
        memory_bus: buses.length > 1 ? buses[i] ?? null : buses[0] ?? null,
        gpu_clock: boostMhz ?? null,
        cuda_cores: num(x['NVIDIA CUDA® Cores']),
        interface: gen ? `PCI Express ${gen}.0` : null,
        hdmi_version: hdmi,
        max_displays: disp ? Number(disp) : null,
        directx: dx,
        psu_min: psu,
        power_connectors: conn && /\d/.test(conn) ? conn : null,
        card_length: len ? Number(len) : null,
      }) })
  })
}
const nNv = out.length

// ---------- AMD ----------
const amdDate = (s) => {
  s = String(s ?? '').trim()
  let m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) { const y = m[3].length === 2 ? `20${m[3]}` : m[3]; return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` }
  m = s.match(/Q([1-4])\s*'?(\d{2,4})/i)
  if (m) { const y = m[2].length === 2 ? `20${m[2]}` : m[2]; return `${y}-${QM[m[1]]}-01` }
  return null
}
for (const x of amd) {
  const name = String(x.name).replace(/™|®/g, '').replace(/^AMD\s+/, '').replace(/^(RX\s)/, 'Radeon $1').replace(/\s+/g, ' ').trim()
  const chip = name.replace(/\s*\((OEM|\d+GB)\)$/i, '').replace(/\s+(Midnight Black|50th Anniversary|LP)$/i, '').trim()
  const bus = String(x.busType ?? '').match(/(\d)\.0(?:\s*(x\d+))?/)
  push({ brand: 'AMD', name, release_date: amdDate(x.launchDate), source_url: x.url,
    specs: clean({
      gpu_chip: chip, gpu_brand: 'AMD',
      vram: num(x.maxMemorySize), vram_type: x.memoryType ?? null,
      memory_bus: num(x.memoryInterface),
      gpu_clock: num(x.boostFrequency) ?? num(x.gameFrequency) ?? num(x.baseFrequency),
      interface: bus ? `PCI Express ${bus[1]}.0${bus[2] ? ` ${bus[2]}` : ''}` : null,
      hdmi_version: String(x.hdmi ?? '').match(/^\d\.\d+[a-z]?/)?.[0] ?? null,
      displayport: String(x.displayport ?? '').match(/^\d\.\d+[a-z]?/)?.[0] ?? null,
      psu_min: num(x.minimumPsuRecommendation),
      power_connectors: x.additionalPowerConnector && !/^none$/i.test(x.additionalPowerConnector) ? x.additionalPowerConnector : null,
      card_length: num(x.length),
    }) })
}
const nAmd = out.length - nNv

// ---------- Intel Arc ----------
for (const x of arc) {
  const name = `Arc ${x.model}`
  const chip = name.replace(/\s*\(\d+GB\)$/, '')
  const mem = String(x.memory ?? '').match(/^(\d+)\s*GB\s*(GDDR\w+)/i)
  const q = String(x.launch ?? '').match(/Q([1-4])'(\d{2})/)
  push({ brand: 'Intel', name: name.replace(/\((\d+)GB\)/, '($1 GB)'), release_date: q ? `20${q[2]}-${QM[q[1]]}-01` : null, source_url: x.url,
    specs: clean({
      gpu_chip: chip, gpu_brand: 'Intel',
      vram: mem ? Number(mem[1]) : null, vram_type: mem ? mem[2].toUpperCase() : null,
      memory_bus: num(x.bus_bit),
      gpu_clock: num(x.graphics_clock_mhz),
      interface: x.pcie ? `PCI Express ${x.pcie}` : null,
      hdmi_version: x.hdmi || null,
      displayport: x.dp || null,
      max_displays: num(x.displays),
    }) })
}

out.sort((a, b) => String(b.release_date ?? '').localeCompare(String(a.release_date ?? '')) || a.name.localeCompare(b.name))
writeFileSync(here('../../data/official/graphics-cards.json'), JSON.stringify(out, null, 1) + '\n')
console.log(`graphics-cards.json: NVIDIA ${nNv}, AMD ${nAmd}, Intel ${out.length - nNv - nAmd}, всего ${out.length}`)
