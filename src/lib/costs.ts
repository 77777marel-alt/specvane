import { MARKETS, type Locale } from './i18n/config'
import type { SpecValue } from './types'
import { money, number } from './format'

// Средняя цена электроэнергии для домохозяйств (все налоги включены), местная валюта за кВт·ч. Сверено 09.11.2026:
// ЕС/ЕЭЗ/TR — Eurostat nrg_pc_204 (полоса DC, 2026-S1); US — EIA (12 мес. до 06.2026); JP — METI (07.2026, ≈);
// BR — ANEEL B1 + налоги (оценка); UA — регулируемый тариф 2026; AE — DEWA, первая ступень. На странице подписано как оценка.
const TARIFF: Record<string, number> = {
  US: 0.18, DE: 0.36, FR: 0.25, IT: 0.31, ES: 0.25, NL: 0.24, PL: 1.27, SE: 3.3, BR: 1.1, JP: 28.3,
  TR: 3.42, GR: 0.24, CZ: 7.01, RO: 1.46, DK: 1.77, FI: 0.27, NO: 2.23, UA: 4.32, AE: 0.3,
}

type Basis = 'costBasisTv' | 'costBasisMonitor' | 'costBasisWash' | 'costBasisDry' | 'costBasisLabel'
export type RunningCost = { year: string; five: string; kwh: string; tariff: string; country: string; basis: Basis }

/** Оценка расходов на электричество в год по нашим характеристикам (без ИИ). null — если для категории неприменимо. */
export function runningCost(lang: Locale, category: string, specs: SpecValue[]): RunningCost | null {
  const n = (k: string) => { const v = specs.find((s) => s.key === k)?.value; return typeof v === 'number' && v > 0 ? v : null }
  let kwh: number | null = null, basis: Basis = 'costBasisLabel'
  if (category === 'fridges' && n('annual_energy')) kwh = n('annual_energy')
  else if (category === 'washing-machines' && n('energy_100')) { kwh = (n('energy_100')! / 100) * 220; basis = 'costBasisWash' }
  else if (category === 'tumble-dryers' && n('energy_100')) { kwh = (n('energy_100')! / 100) * 160; basis = 'costBasisDry' }
  else if (category === 'tvs' && n('power_typical')) { kwh = (n('power_typical')! * 4 * 365) / 1000; basis = 'costBasisTv' }
  else if (category === 'monitors' && n('power_typical')) { kwh = (n('power_typical')! * 8 * 250) / 1000; basis = 'costBasisMonitor' }
  else if (category === 'projectors' && n('power_typical')) { kwh = (n('power_typical')! * 2 * 365) / 1000; basis = 'costBasisTv' }
  if (!kwh) return null
  const m = MARKETS[lang], cc = m.defaultCountry, price = TARIFF[cc]
  if (!price) return null
  const country = new Intl.DisplayNames([m.hreflang], { type: 'region' }).of(cc) ?? cc
  return {
    year: money(lang, Math.round(kwh * price), m.currency), five: money(lang, Math.round(kwh * price * 5), m.currency),
    kwh: number(lang, Math.round(kwh)), tariff: money(lang, price, m.currency), country, basis,
  }
}
