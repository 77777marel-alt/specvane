import 'server-only'
import data from '../../data/updates/policies.json'

// Сроки обновлений ПО для телефонов и планшетов — по официальным обещаниям производителей (data/updates/policies.json).
type Rule = { brand: string; match: string; os_years: number | null; os_upgrades?: number | null; security_years: number | null; from?: string; official?: boolean; source_type?: string; note?: string; source: string }
type Model = { brand: string; model: string; os_until: string | null; security_until: string | null; os_upgrades?: number | null; source: string; source_type?: string }
const RULES = (data as { rules: Rule[] }).rules.map((r) => ({ ...r, re: new RegExp(r.match, 'i') }))
const MODELS = (data as { models: Model[] }).models

export type Support = { securityUntil: string | null; osUntil: string | null; osUpgrades: number | null; official: boolean; press: boolean; source: string }

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
// имена из каталога бывают с памятью, годом, «Dual SIM», «5G» — пробуем несколько вариантов
const clean = (n: string) => n.replace(/\s*\((19|20)\d\d\)\s*$/, '').replace(/\s+\d+\s*(GB|TB)(\s*\+?\s*\d+\s*(GB|TB))?\b.*$/i, '')
  .replace(/\s+(Dual SIM|Enterprise Edition|EE|Wi-?Fi|LTE|Cellular)\b.*$/i, '').replace(/\s+/g, ' ').trim()
const cands = (n: string) => { const c = clean(n); const no5 = c.replace(/\s+5G$/i, ''); return [...new Set([n, c, no5, `${no5} 5G`])] }
const addYears = (date: string, years: number) => { const d = new Date(date); d.setUTCFullYear(d.getUTCFullYear() + years); return d.toISOString().slice(0, 7) }

export function supportFor(brand: string, name: string, release: string | null): Support | null {
  const b = norm(brand)
  const names = cands(name).map(norm)
  const m = MODELS.find((x) => norm(x.brand) === b && names.some((c) => norm(x.model) === c || norm(x.model) === `${b} ${c}`))
  if (m && (m.security_until || m.os_until))
    return { securityUntil: m.security_until, osUntil: m.os_until, osUpgrades: m.os_upgrades ?? null, official: true, press: m.source_type === 'press', source: m.source }
  const r = RULES.find((x) => norm(x.brand) === b && cands(name).some((c) => x.re.test(c)))
  if (!r || !release) return null
  return {
    securityUntil: r.security_years ? addYears(release, r.security_years) : null,
    osUntil: r.os_years ? addYears(release, r.os_years) : null,
    osUpgrades: r.os_upgrades ?? null,
    official: r.official !== false, press: r.source_type === 'press', source: r.source,
  }
}
