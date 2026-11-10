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
import td from '../../data/errors/tumble-dryers.json'
import fr from '../../data/errors/fridges.json'
import cm from '../../data/errors/coffee-machines.json'
import ac from '../../data/errors/air-conditioners.json'
import bo from '../../data/errors/boilers.json'
import deTd from '../../data/errors/i18n/de/tumble-dryers.json'
import deFr from '../../data/errors/i18n/de/fridges.json'
import deCm from '../../data/errors/i18n/de/coffee-machines.json'
import deAc from '../../data/errors/i18n/de/air-conditioners.json'
import deBo from '../../data/errors/i18n/de/boilers.json'
import frTd from '../../data/errors/i18n/fr/tumble-dryers.json'
import frFr from '../../data/errors/i18n/fr/fridges.json'
import frCm from '../../data/errors/i18n/fr/coffee-machines.json'
import frAc from '../../data/errors/i18n/fr/air-conditioners.json'
import frBo from '../../data/errors/i18n/fr/boilers.json'
import itTd from '../../data/errors/i18n/it/tumble-dryers.json'
import itFr from '../../data/errors/i18n/it/fridges.json'
import itCm from '../../data/errors/i18n/it/coffee-machines.json'
import itAc from '../../data/errors/i18n/it/air-conditioners.json'
import itBo from '../../data/errors/i18n/it/boilers.json'
import esTd from '../../data/errors/i18n/es/tumble-dryers.json'
import esFr from '../../data/errors/i18n/es/fridges.json'
import esCm from '../../data/errors/i18n/es/coffee-machines.json'
import esAc from '../../data/errors/i18n/es/air-conditioners.json'
import esBo from '../../data/errors/i18n/es/boilers.json'
import elTd from '../../data/errors/i18n/el/tumble-dryers.json'
import elFr from '../../data/errors/i18n/el/fridges.json'
import elCm from '../../data/errors/i18n/el/coffee-machines.json'
import elAc from '../../data/errors/i18n/el/air-conditioners.json'
import elBo from '../../data/errors/i18n/el/boilers.json'
import ruTd from '../../data/errors/i18n/ru/tumble-dryers.json'
import ruFr from '../../data/errors/i18n/ru/fridges.json'
import ruCm from '../../data/errors/i18n/ru/coffee-machines.json'
import ruAc from '../../data/errors/i18n/ru/air-conditioners.json'
import ruBo from '../../data/errors/i18n/ru/boilers.json'

// Коды ошибок техники: факты с официальных страниц производителей, текст — своими словами (data/errors/*.json).
// Переводы кладутся в data/errors/i18n/<lang>/<appliance>.json — страницы языка появляются, когда перевод есть.

export type ErrorCode = { brand: string; code: string; aliases: string[]; title: string; causes: string[]; steps: string[]; technician: string; source: string }
export const APPLIANCES = { 'washing-machines': washers as ErrorCode[], dishwashers: dishwashers as ErrorCode[], 'tumble-dryers': td as ErrorCode[], 'fridges': fr as ErrorCode[], 'coffee-machines': cm as ErrorCode[], 'air-conditioners': ac as ErrorCode[], 'boilers': bo as ErrorCode[] } as const
export type Appliance = keyof typeof APPLIANCES

/** Языки, на которых раздел уже переведён. */
type Tr = Record<string, Pick<ErrorCode, 'title' | 'causes' | 'steps' | 'technician'>>
const TRANSLATIONS: Partial<Record<Locale, Record<Appliance, Tr>>> = {
  de: { 'washing-machines': deW, dishwashers: deD, 'tumble-dryers': deTd, 'fridges': deFr, 'coffee-machines': deCm, 'air-conditioners': deAc, 'boilers': deBo },
  fr: { 'washing-machines': frW, dishwashers: frD, 'tumble-dryers': frTd, 'fridges': frFr, 'coffee-machines': frCm, 'air-conditioners': frAc, 'boilers': frBo },
  it: { 'washing-machines': itW, dishwashers: itD, 'tumble-dryers': itTd, 'fridges': itFr, 'coffee-machines': itCm, 'air-conditioners': itAc, 'boilers': itBo },
  es: { 'washing-machines': esW, dishwashers: esD, 'tumble-dryers': esTd, 'fridges': esFr, 'coffee-machines': esCm, 'air-conditioners': esAc, 'boilers': esBo },
  el: { 'washing-machines': elW, dishwashers: elD, 'tumble-dryers': elTd, 'fridges': elFr, 'coffee-machines': elCm, 'air-conditioners': elAc, 'boilers': elBo },
  ru: { 'washing-machines': ruW, dishwashers: ruD, 'tumble-dryers': ruTd, 'fridges': ruFr, 'coffee-machines': ruCm, 'air-conditioners': ruAc, 'boilers': ruBo },
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

/** Название техники: one — в заголовке «Bosch {one} ошибка E15», many — заголовок группы, slug — адрес, если категории нет в базе. */
type Names = Record<Appliance, { one: string; many: string; slug: string }>
export const APPLIANCE_NAMES: Partial<Record<Locale, Names>> = {
  en: { 'washing-machines': { one: 'washing machine', many: 'Washing machines', slug: 'washing-machines' }, dishwashers: { one: 'dishwasher', many: 'Dishwashers', slug: 'dishwashers' }, 'tumble-dryers': { one: 'tumble dryer', many: 'Tumble dryers', slug: 'tumble-dryers' }, fridges: { one: 'fridge', many: 'Fridges', slug: 'fridges' }, 'coffee-machines': { one: 'coffee machine', many: 'Coffee machines', slug: 'coffee-machines' }, 'air-conditioners': { one: 'air conditioner', many: 'Air conditioners', slug: 'air-conditioners' }, boilers: { one: 'boiler', many: 'Gas boilers', slug: 'boilers' } },
  de: { 'washing-machines': { one: 'Waschmaschine', many: 'Waschmaschinen', slug: 'waschmaschinen' }, dishwashers: { one: 'Geschirrspüler', many: 'Geschirrspüler', slug: 'geschirrspueler' }, 'tumble-dryers': { one: 'Wäschetrockner', many: 'Wäschetrockner', slug: 'waeschetrockner' }, fridges: { one: 'Kühlschrank', many: 'Kühlschränke', slug: 'kuehlschraenke' }, 'coffee-machines': { one: 'Kaffeevollautomat', many: 'Kaffeemaschinen', slug: 'kaffeemaschinen' }, 'air-conditioners': { one: 'Klimaanlage', many: 'Klimaanlagen', slug: 'klimaanlagen' }, boilers: { one: 'Gastherme', many: 'Gasthermen', slug: 'gasthermen' } },
  fr: { 'washing-machines': { one: 'lave-linge', many: 'Lave-linge', slug: 'lave-linge' }, dishwashers: { one: 'lave-vaisselle', many: 'Lave-vaisselle', slug: 'lave-vaisselle' }, 'tumble-dryers': { one: 'sèche-linge', many: 'Sèche-linge', slug: 'seche-linge' }, fridges: { one: 'réfrigérateur', many: 'Réfrigérateurs', slug: 'refrigerateurs' }, 'coffee-machines': { one: 'machine à café', many: 'Machines à café', slug: 'machines-a-cafe' }, 'air-conditioners': { one: 'climatiseur', many: 'Climatiseurs', slug: 'climatiseurs' }, boilers: { one: 'chaudière', many: 'Chaudières gaz', slug: 'chaudieres' } },
  it: { 'washing-machines': { one: 'lavatrice', many: 'Lavatrici', slug: 'lavatrici' }, dishwashers: { one: 'lavastoviglie', many: 'Lavastoviglie', slug: 'lavastoviglie' }, 'tumble-dryers': { one: 'asciugatrice', many: 'Asciugatrici', slug: 'asciugatrici' }, fridges: { one: 'frigorifero', many: 'Frigoriferi', slug: 'frigoriferi' }, 'coffee-machines': { one: 'macchina da caffè', many: 'Macchine da caffè', slug: 'macchine-caffe' }, 'air-conditioners': { one: 'condizionatore', many: 'Condizionatori', slug: 'condizionatori' }, boilers: { one: 'caldaia', many: 'Caldaie a gas', slug: 'caldaie' } },
  es: { 'washing-machines': { one: 'lavadora', many: 'Lavadoras', slug: 'lavadoras' }, dishwashers: { one: 'lavavajillas', many: 'Lavavajillas', slug: 'lavavajillas' }, 'tumble-dryers': { one: 'secadora', many: 'Secadoras', slug: 'secadoras' }, fridges: { one: 'frigorífico', many: 'Frigoríficos', slug: 'frigorificos' }, 'coffee-machines': { one: 'cafetera', many: 'Cafeteras', slug: 'cafeteras' }, 'air-conditioners': { one: 'aire acondicionado', many: 'Aires acondicionados', slug: 'aire-acondicionado' }, boilers: { one: 'caldera', many: 'Calderas de gas', slug: 'calderas' } },
  el: { 'washing-machines': { one: 'πλυντήριο ρούχων', many: 'Πλυντήρια ρούχων', slug: 'plyntiria-rouchon' }, dishwashers: { one: 'πλυντήριο πιάτων', many: 'Πλυντήρια πιάτων', slug: 'plyntiria-piaton' }, 'tumble-dryers': { one: 'στεγνωτήριο', many: 'Στεγνωτήρια', slug: 'stegnotiria' }, fridges: { one: 'ψυγείο', many: 'Ψυγεία', slug: 'psygeia' }, 'coffee-machines': { one: 'μηχανή καφέ', many: 'Μηχανές καφέ', slug: 'michanes-kafe' }, 'air-conditioners': { one: 'κλιματιστικό', many: 'Κλιματιστικά', slug: 'klimatistika' }, boilers: { one: 'λέβητας', many: 'Λέβητες αερίου', slug: 'levites' } },
  ru: { 'washing-machines': { one: 'стиральная машина', many: 'Стиральные машины', slug: 'stiralnye-mashiny' }, dishwashers: { one: 'посудомоечная машина', many: 'Посудомоечные машины', slug: 'posudomoechnye-mashiny' }, 'tumble-dryers': { one: 'сушильная машина', many: 'Сушильные машины', slug: 'sushilnye-mashiny' }, fridges: { one: 'холодильник', many: 'Холодильники', slug: 'holodilniki' }, 'coffee-machines': { one: 'кофемашина', many: 'Кофемашины', slug: 'kofemashiny' }, 'air-conditioners': { one: 'кондиционер', many: 'Кондиционеры', slug: 'kondicionery' }, boilers: { one: 'газовый котёл', many: 'Газовые котлы', slug: 'gazovye-kotly' } },
}
export const applianceName = (lang: Locale, a: Appliance) => (APPLIANCE_NAMES[lang] ?? APPLIANCE_NAMES.en!)[a]
