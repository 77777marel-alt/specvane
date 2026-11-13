import type { Locale } from './i18n/config'
import list from '../../data/os/list.json'
import uen from '../../data/os/ui/en.json'
import ude from '../../data/os/ui/de.json'
import ufr from '../../data/os/ui/fr.json'
import uit from '../../data/os/ui/it.json'
import ues from '../../data/os/ui/es.json'
import unl from '../../data/os/ui/nl.json'
import upl from '../../data/os/ui/pl.json'
import usv from '../../data/os/ui/sv.json'
import uptbr from '../../data/os/ui/pt-br.json'
import uja from '../../data/os/ui/ja.json'
import utr from '../../data/os/ui/tr.json'
import uel from '../../data/os/ui/el.json'
import ucs from '../../data/os/ui/cs.json'
import uro from '../../data/os/ui/ro.json'
import uda from '../../data/os/ui/da.json'
import ufi from '../../data/os/ui/fi.json'
import unb from '../../data/os/ui/nb.json'
import uru from '../../data/os/ui/ru.json'
import uuk from '../../data/os/ui/uk.json'
import uar from '../../data/os/ui/ar.json'
import tde from '../../data/os/i18n/de.json'
import tfr from '../../data/os/i18n/fr.json'
import tit from '../../data/os/i18n/it.json'
import tes from '../../data/os/i18n/es.json'
import tnl from '../../data/os/i18n/nl.json'
import tpl from '../../data/os/i18n/pl.json'
import tsv from '../../data/os/i18n/sv.json'
import tptbr from '../../data/os/i18n/pt-br.json'
import tja from '../../data/os/i18n/ja.json'
import ttr from '../../data/os/i18n/tr.json'
import tel from '../../data/os/i18n/el.json'
import tcs from '../../data/os/i18n/cs.json'
import tro from '../../data/os/i18n/ro.json'
import tda from '../../data/os/i18n/da.json'
import tfi from '../../data/os/i18n/fi.json'
import tnb from '../../data/os/i18n/nb.json'
import tru from '../../data/os/i18n/ru.json'
import tuk from '../../data/os/i18n/uk.json'
import tar from '../../data/os/i18n/ar.json'

// «Какие устройства получат iOS / Android / One UI…»: официальные списки производителей (data/os/list.json),
// проверены по сайтам Apple, Google, Samsung, Xiaomi, OnePlus, Nothing. Без слухов и прогнозов.
export type OsEntry = { slug: string; vendor: string; os: string; version: string; status: string; announced: string | null; released: string | null
  summary: string; highlights: string[]; devices: string[]; dropped: string[]; source: string; source2: string | null }
type OsUi = typeof uen
const UI = { 'en': uen, 'de': ude, 'fr': ufr, 'it': uit, 'es': ues, 'nl': unl, 'pl': upl, 'sv': usv, 'pt-br': uptbr, 'ja': uja, 'tr': utr, 'el': uel, 'cs': ucs, 'ro': uro, 'da': uda, 'fi': ufi, 'nb': unb, 'ru': uru, 'uk': uuk, 'ar': uar } as Record<Locale, OsUi>
const TX = { 'de': tde, 'fr': tfr, 'it': tit, 'es': tes, 'nl': tnl, 'pl': tpl, 'sv': tsv, 'pt-br': tptbr, 'ja': tja, 'tr': ttr, 'el': tel, 'cs': tcs, 'ro': tro, 'da': tda, 'fi': tfi, 'nb': tnb, 'ru': tru, 'uk': tuk, 'ar': tar } as Partial<Record<Locale, Record<string, { summary: string; highlights: string[] }>>>
export const osUi = (l: Locale): OsUi => UI[l] ?? uen
const ALL = list as OsEntry[]
export const OS_SLUGS = ALL.map((x) => x.slug)
export const osName = (e: OsEntry) => `${e.os} ${e.version}`
export function osList(lang: Locale): OsEntry[] { return ALL.map((e) => ({ ...e, ...(TX[lang]?.[e.slug] ?? {}) })) }
export function osEntry(lang: Locale, slug: string): OsEntry | null { return osList(lang).find((e) => e.slug === slug) ?? null }

const norm = (s: string) => s.toLowerCase().replace(/[()]/g, ' ').replace(/\s+5g\b/g, '').replace(/\s+/g, ' ').trim()
const VENDOR_BRAND: Record<string, string> = { Apple: 'apple', Google: 'google', Samsung: 'samsung', Xiaomi: 'xiaomi', OnePlus: 'oneplus', Nothing: 'nothing' }
/** Списки обновлений, где модель названа явно (точное совпадение имени, без «серий» и диапазонов). */
export function osForProduct(brand: string, name: string): OsEntry[] {
  const b = brand.toLowerCase(), n = norm(name), full = norm(`${brand} ${name}`)
  return ALL.filter((e) => (VENDOR_BRAND[e.vendor] ?? '') === b || b.includes(VENDOR_BRAND[e.vendor] ?? '#'))
    .filter((e) => e.devices.some((d) => { const x = norm(d); return x === n || x === full }))
}
/** Кандидаты адресов модели в каталоге для имени из официального списка. */
export function slugCandidates(e: OsEntry, device: string): string[] {
  // как в импорте каталога (scripts/icecat/map.mjs): «+» → «-plus»
  const s = (x: string) => x.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const vb = VENDOR_BRAND[e.vendor] ?? ''
  const d = device.replace(/\s+5G$/i, '')
  return [...new Set([s(device), s(d), s(`${vb} ${device}`), s(`${vb} ${d}`)])]
}
