import { MARKETS, type Locale } from './i18n/config'
import type { SpecValue } from './types'

// Средняя цена электроэнергии для домохозяйств (все налоги включены), местная валюта за кВт·ч — значение по умолчанию
// для калькулятора (посетитель вводит свою). Сверено 09.11.2026: ЕС/ЕЭЗ/TR — Eurostat nrg_pc_204 (DC, 2026-S1);
// US — EIA (12 мес. до 06.2026); JP — METI (07.2026, ≈); BR — ANEEL B1 + налоги (оценка); UA — тариф 2026; AE — DEWA.
const TARIFF: Record<string, number> = {
  US: 0.18, DE: 0.36, FR: 0.25, IT: 0.31, ES: 0.25, NL: 0.24, PL: 1.27, SE: 3.3, BR: 1.1, JP: 28.3,
  TR: 3.42, GR: 0.24, CZ: 7.01, RO: 1.46, DK: 1.77, FI: 0.27, NO: 2.23, UA: 4.32, AE: 0.3,
}

/**
 * Данные для калькулятора расходов: либо мощность (Вт) × часы в день × дни в году,
 * либо энергия за цикл (кВт·ч) × циклов в год, либо годовое потребление по этикетке.
 */
export type CostInput = {
  mode: 'power' | 'cycle' | 'annual'
  watts?: number; hours?: number; days?: number
  perCycle?: number; cycles?: number
  annual?: number
  tariff: number; currency: string; locale: string; country: string
  basis: 'costBasisTv' | 'costBasisMonitor' | 'costBasisWash' | 'costBasisDry' | 'costBasisLabel'
}

export function costInput(lang: Locale, category: string, specs: SpecValue[]): CostInput | null {
  const n = (k: string) => { const v = specs.find((s) => s.key === k)?.value; return typeof v === 'number' && v > 0 ? v : null }
  const m = MARKETS[lang], cc = m.defaultCountry
  const base = { tariff: TARIFF[cc] ?? 0.3, currency: m.currency, locale: m.hreflang, country: new Intl.DisplayNames([m.hreflang], { type: 'region' }).of(cc) ?? cc }
  if (category === 'fridges' && n('annual_energy')) return { ...base, mode: 'annual', annual: n('annual_energy')!, basis: 'costBasisLabel' }
  if (category === 'washing-machines' && n('energy_100')) return { ...base, mode: 'cycle', perCycle: n('energy_100')! / 100, cycles: 220, basis: 'costBasisWash' }
  if (category === 'tumble-dryers' && n('energy_100')) return { ...base, mode: 'cycle', perCycle: n('energy_100')! / 100, cycles: 160, basis: 'costBasisDry' }
  if (category === 'tvs' && n('power_typical')) return { ...base, mode: 'power', watts: n('power_typical')!, hours: 4, days: 365, basis: 'costBasisTv' }
  if (category === 'monitors' && n('power_typical')) return { ...base, mode: 'power', watts: n('power_typical')!, hours: 8, days: 250, basis: 'costBasisMonitor' }
  if (category === 'projectors' && n('power_typical')) return { ...base, mode: 'power', watts: n('power_typical')!, hours: 2, days: 365, basis: 'costBasisTv' }
  return null
}
