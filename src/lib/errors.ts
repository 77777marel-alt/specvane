import 'server-only'
import type { Locale } from './i18n/config'
import washers from '../../data/errors/washing-machines.json'
import dishwashers from '../../data/errors/dishwashers.json'
import deW from '../../data/errors/i18n/de/washing-machines.json'
import deD from '../../data/errors/i18n/de/dishwashers.json'
import frW from '../../data/errors/i18n/fr/washing-machines.json'
import frD from '../../data/errors/i18n/fr/dishwashers.json'
import itW from '../../data/errors/i18n/it/washing-machines.json'
import itD from '../../data/errors/i18n/it/dishwashers.json'
import esW from '../../data/errors/i18n/es/washing-machines.json'
import esD from '../../data/errors/i18n/es/dishwashers.json'
import elW from '../../data/errors/i18n/el/washing-machines.json'
import elD from '../../data/errors/i18n/el/dishwashers.json'
import ruW from '../../data/errors/i18n/ru/washing-machines.json'
import ruD from '../../data/errors/i18n/ru/dishwashers.json'

// Коды ошибок техники: факты с официальных страниц производителей, текст — своими словами (data/errors/*.json).
// Переводы кладутся в data/errors/i18n/<lang>/<appliance>.json — страницы языка появляются, когда перевод есть.

export type ErrorCode = { brand: string; code: string; aliases: string[]; title: string; causes: string[]; steps: string[]; technician: string; source: string }
export const APPLIANCES = { 'washing-machines': washers as ErrorCode[], dishwashers: dishwashers as ErrorCode[] } as const
export type Appliance = keyof typeof APPLIANCES

/** Языки, на которых раздел уже переведён. */
type Tr = Record<string, Pick<ErrorCode, 'title' | 'causes' | 'steps' | 'technician'>>
const TRANSLATIONS: Partial<Record<Locale, Record<Appliance, Tr>>> = {
  de: { 'washing-machines': deW, dishwashers: deD }, fr: { 'washing-machines': frW, dishwashers: frD },
  it: { 'washing-machines': itW, dishwashers: itD }, es: { 'washing-machines': esW, dishwashers: esD },
  el: { 'washing-machines': elW, dishwashers: elD }, ru: { 'washing-machines': ruW, dishwashers: ruD },
}
export const ERROR_LANGS: Locale[] = ['en', ...(Object.keys(TRANSLATIONS) as Locale[])]
export const hasErrors = (lang: Locale) => ERROR_LANGS.includes(lang)

export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const isAppliance = (k: string): k is Appliance => k in APPLIANCES

function localized(lang: Locale, appliance: Appliance, e: ErrorCode): ErrorCode {
  const tr = TRANSLATIONS[lang]?.[appliance]?.[`${e.brand}|${e.code}`]
  return tr ? { ...e, ...tr } : e
}

export function errorBrands(appliance: Appliance) {
  const m = new Map<string, number>()
  for (const e of APPLIANCES[appliance]) m.set(e.brand, (m.get(e.brand) ?? 0) + 1)
  return [...m].map(([brand, n]) => ({ brand, slug: slugify(brand), n })).sort((a, b) => a.brand.localeCompare(b.brand))
}

export function errorCodes(lang: Locale, appliance: Appliance, brandSlug: string) {
  return APPLIANCES[appliance].filter((e) => slugify(e.brand) === brandSlug).map((e) => ({ ...localized(lang, appliance, e), slug: slugify(e.code) }))
}

export function errorCode(lang: Locale, appliance: Appliance, brandSlug: string, codeSlug: string) {
  const list = errorCodes(lang, appliance, brandSlug)
  const hit = list.find((e) => e.slug === codeSlug) ?? list.find((e) => e.aliases.some((a) => slugify(a) === codeSlug))
  return hit ? { item: hit, others: list.filter((e) => e !== hit) } : null
}

export function allErrorPaths() {
  return (Object.keys(APPLIANCES) as Appliance[]).flatMap((a) => APPLIANCES[a].map((e) => ({ appliance: a, brand: slugify(e.brand), code: slugify(e.code) })))
}
