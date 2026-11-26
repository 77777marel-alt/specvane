// Сборка data/official/processors.json из официальных таблиц производителей:
//   data/official/raw/intel-core.json — страницы характеристик Intel ARK (Core, Core Ultra, 10-е поколение и новее)
//   data/official/raw/amd-ryzen.json  — таблица спецификаций amd.com (Ryzen, Ryzen PRO, Threadripper)
// Только факты производителя: никаких оценок «сильнее/слабее» (решение Максима 26.11.2026).
// Ключи f<ID> — характеристики категории processors (из Open Icecat), см. spec_definitions.
// Запуск: node scripts/official/processors-build.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const here = (p) => new URL(p, import.meta.url)
const intel = JSON.parse(readFileSync(here('../../data/official/raw/intel-core.json'), 'utf8'))
const amd = JSON.parse(readFileSync(here('../../data/official/raw/amd-ryzen.json'), 'utf8'))

const num = (s) => { const m = String(s ?? '').replace(',', '.').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : null }
const ghz = (s) => { if (!s) return null; const v = num(s); if (v == null) return null; return /mhz/i.test(s) ? Math.round(v) / 1000 : v }
const yes = (s) => (s == null ? null : /^yes/i.test(String(s).trim()) ? true : /^no/i.test(String(s).trim()) ? false : null)
const CH = { 1: 'Single-channel', 2: 'Dual-channel', 3: 'Triple-channel', 4: 'Quad-channel', 6: 'Hexa-channel', 8: 'Octa-channel', 12: 'Dodeca-channel' }
const memTypes = (s) => {
  const seen = []
  for (const m of String(s ?? '').matchAll(/LPDDR5X|LPDDR5|LPDDR4X|LPDDR4|LPDDR3|DDR5|DDR4|DDR3L|DDR3/gi)) {
    const t = m[0].toUpperCase().replace('LPDDR5X', 'LPDDR5x').replace('LPDDR4X', 'LPDDR4x')
    const v = `${t}-SDRAM`; if (!seen.includes(v)) seen.push(v)
  }
  return seen.length ? seen.join(',') : null
}
const pcie = (s) => { const v = [...String(s ?? '').matchAll(/(\d)\.0/g)].map((m) => Number(m[1])); return v.length ? Math.max(...v) : null }
const QM = { 1: '01', 2: '04', 3: '07', 4: '10' }
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== '' && !(typeof v === 'number' && !Number.isFinite(v))))

// ---------- Intel ----------
const intelDate = (s) => { const m = String(s ?? '').match(/Q([1-4])'(\d{2})/); return m ? `20${m[2]}-${QM[m[1]]}-01` : null }
const intelName = (x) => {
  const pn = x['Processor Number']; if (!pn) return null
  if (/^i[3579]-/i.test(pn)) return `Core ${pn}`
  const seg = String(x.url).split('/sku/')[1]?.split('/')[1] ?? ''
  const pre = seg.split('-processor')[0] // intel-core-ultra-9 | intel-core-7 | intel-core
  const words = pre.replace(/^intel-/, '').split('-').map((w) => (/^\d+$/.test(w) ? w : w[0].toUpperCase() + w.slice(1)))
  return `${words.join(' ')} ${pn}`.replace(/\s+/g, ' ').trim()
}
const intelFamily = (name) => {
  const m = name.match(/^Core (Ultra X?\d|i[3579]|\d)/); return m ? `Intel Core ${m[1]}` : 'Intel Core'
}
const SEG = { Desktop: 'Desktop', Mobile: 'Mobile', Embedded: 'Embedded', Server: 'Server', Workstation: 'Workstation' }
const instr = (s) => s ? String(s).replace(/Intel®\s*/g, '').split(',').map((t) => t.trim().replace(/^AVX2$/, 'AVX 2.0').replace(/^AVX-512.*$/, 'AVX-512')).filter(Boolean).filter((t, i, a) => a.indexOf(t) === i).join(',') : null

const out = []
const seen = new Set()
for (const x of intel) {
  const name = intelName(x); if (!name) continue
  const key = name.toLowerCase(); if (seen.has(key)) continue; seen.add(key)
  const ch = num(x['Max # of Memory Channels'])
  out.push({ brand: 'Intel', name, release_date: intelDate(x['Launch Date']), source_url: `https://www.intel.com${x.url}`,
    specs: clean({
      f2196: intelFamily(name),
      f42412: ghz(x['Processor Base Frequency'] ?? x['Performance-core Base Frequency']),
      f7978: ghz(x['Max Turbo Frequency']),
      f6089: num(x['Total Cores']),
      f7337: num(x['Total Threads']),
      f10041: num(x['Cache']),
      f11778: num(x['Processor Base Power'] ?? x['TDP']),
      f2325: x['Sockets Supported'] ?? null,
      f7975: /64-bit/.test(x['Instruction Set'] ?? '') ? '64-bit' : null,
      f21987: num(x['Max Memory Size (dependent on memory type)']),
      f21994: memTypes(x['Memory Types']),
      f7788: ch ? CH[ch] ?? null : null,
      f1628: yes(x['ECC Memory Supported']),
      f9997: x['GPU Name'] ? true : (x['Processor Graphics ‡'] ? true : null),
      f10196: yes(x['Execute Disable Bit']),
      f21801: SEG[x['Vertical Segment']] ?? null,
      f20905: num(x['Max # of PCI Express Lanes']),
      f7825: pcie(x['PCI Express Revision']),
      f3260: instr(x['Instruction Set Extensions']),
      f10265: x['Scalability'] ? String(x['Scalability']).replace(/\s*Only$/i, '') : null,
      f9672: yes(x['Intel® Hyper-Threading Technology']),
      f10194: yes(x['Intel® AES New Instructions']),
      f10200: yes(x['Intel® Trusted Execution Technology']),
      f10282: yes(x['Intel® VT-x with Extended Page Tables (EPT)']),
      f21759: yes(x['Intel® Virtualization Technology (VT-x)']),
      f18653: yes(x['Intel® Virtualization Technology for Directed I/O (VT-d)']),
    }) })
}
const nIntel = out.length

// ---------- AMD ----------
const amdDateRaw = (s) => {
  s = String(s ?? '').trim()
  let m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) { const y = m[3].length === 2 ? `20${m[3]}` : m[3]; return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` }
  m = s.match(/Q([1-4])\s*'?(\d{2,4})/i)
  if (m) { const y = m[2].length === 2 ? `20${m[2]}` : m[2]; return `${y}-${QM[m[1]]}-01` }
  return null
}
const amdName = (s) => String(s).replace(/™|®/g, '').replace(/^AMD\s+/, '').replace(/^RyzenAI/, 'Ryzen AI').replace(/\s+with\s+.*$/i, '').replace(/\s+/g, ' ').trim()
const amdFamily = (name) => {
  const m = name.match(/^Ryzen (Threadripper PRO|Threadripper|AI Max\+? PRO|AI Max\+?|AI Z\d \w+|AI \d+ PRO|AI \d+|Z\d|\d PRO|\d)/)
  return m ? `AMD Ryzen ${m[1]}` : 'AMD Ryzen'
}
const MOBILE = /\d(U|H|HS|HX|HX3D|M|C)$|^Ryzen (AI|Z\d)/
const amdRows = amd.map((x) => ({ x, name: amdName(x.name), date: amdDateRaw(x.launchDate) }))
// у AMD встречаются явные опечатки в датах (Ryzen 3 3100U — «Q2 2026»): дата не может быть позже медианы серии больше чем на 2 года
const bySeries = {}
for (const r of amdRows) if (r.date) (bySeries[r.x.series] ??= []).push(Number(r.date.slice(0, 4)))
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)] }
for (const r of amdRows) {
  const { x, name } = r
  const key = `amd ${name}`.toLowerCase(); if (seen.has(key)) continue; seen.add(key)
  let date = r.date
  if (date && bySeries[x.series] && Number(date.slice(0, 4)) > median(bySeries[x.series]) + 2) date = null
  const ch = num(x.memoryChannels)
  const ff = String(x.formFactor ?? '')
  const seg = /Handheld/.test(ff) || MOBILE.test(name) ? 'Mobile' : /Desktop|Boxed/.test(ff) ? 'Desktop' : /Laptop/.test(ff) ? 'Mobile' : null
  const gpu = x.graphicsModel && !/Discrete Graphics Card Required/i.test(x.graphicsModel)
  out.push({ brand: 'AMD', name, release_date: date, source_url: x.url,
    specs: clean({
      f2196: amdFamily(name),
      f42412: ghz(x.baseClock),
      f7978: ghz(x.maxBoostClock),
      f6089: num(x.numOfCpuCores),
      f7337: num(x.numOfThreads),
      f10041: num(x.l3Cache),
      f11778: num(x.defaultTdp),
      f2325: x.cpuSocket ?? null,
      f7975: '64-bit',
      f21994: memTypes(x.systemMemoryType),
      f7788: ch ? CH[ch] ?? null : null,
      f9997: x.graphicsModel ? gpu : null,
      f21801: seg,
      f7825: pcie(x.pciExpressVersion),
    }) })
}

out.sort((a, b) => String(b.release_date ?? '').localeCompare(String(a.release_date ?? '')) || a.name.localeCompare(b.name))
writeFileSync(here('../../data/official/processors.json'), JSON.stringify(out, null, 1) + '\n')
console.log(`processors.json: Intel ${nIntel}, AMD ${out.length - nIntel}, всего ${out.length}`)
