import type { Locale } from './i18n/config'
import POL from '../../data/updates/policies.json'
import en from '../../data/reports/en.json'
import de from '../../data/reports/de.json'
import fr from '../../data/reports/fr.json'
import it from '../../data/reports/it.json'
import es from '../../data/reports/es.json'
import nl from '../../data/reports/nl.json'
import pl from '../../data/reports/pl.json'
import sv from '../../data/reports/sv.json'
import ptbr from '../../data/reports/pt-br.json'
import ja from '../../data/reports/ja.json'
import tr from '../../data/reports/tr.json'
import el from '../../data/reports/el.json'
import cs from '../../data/reports/cs.json'
import ro from '../../data/reports/ro.json'
import da from '../../data/reports/da.json'
import fi from '../../data/reports/fi.json'
import nb from '../../data/reports/nb.json'
import ru from '../../data/reports/ru.json'
import uk from '../../data/reports/uk.json'
import ar from '../../data/reports/ar.json'

// Отчёт «Тренды техники 2026» (data/reports/<язык>.json): медианы характеристик по годам выпуска — для цитирования СМИ и блогерами.
export type ReportText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, ReportText>
export const reportText = (l: Locale): ReportText => T[l] ?? en
export const REPORT_SLUG = 'tech-trends-2026'
export const REPORT_CATS = ['smartphones', 'laptops', 'tablets', 'tvs', 'monitors', 'headphones', 'smartwatches', 'washing-machines', 'fridges', 'tumble-dryers', 'coffee-machines', 'graphics-cards']

/** Самая долгая обещанная поддержка по брендам (лучшие по поддержке модели), из официальных политик. */
export function brandSupport() {
  const m = new Map<string, { sec: number; os: number; official: boolean }>()
  for (const r of (POL as { rules: { brand: string; security_years?: number | null; os_years?: number | null; official?: boolean }[] }).rules) {
    const cur = m.get(r.brand) ?? { sec: 0, os: 0, official: true }
    m.set(r.brand, { sec: Math.max(cur.sec, r.security_years ?? 0), os: Math.max(cur.os, r.os_years ?? 0), official: cur.official && r.official !== false })
  }
  return [...m].map(([brand, v]) => ({ brand, ...v })).sort((a, b) => b.sec - a.sec || b.os - a.os)
}
