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

import nlW from '../../data/errors/i18n/nl/washing-machines.json'
import nlD from '../../data/errors/i18n/nl/dishwashers.json'
import nlTd from '../../data/errors/i18n/nl/tumble-dryers.json'
import nlFr from '../../data/errors/i18n/nl/fridges.json'
import nlCm from '../../data/errors/i18n/nl/coffee-machines.json'
import nlAc from '../../data/errors/i18n/nl/air-conditioners.json'
import nlBo from '../../data/errors/i18n/nl/boilers.json'
import plW from '../../data/errors/i18n/pl/washing-machines.json'
import plD from '../../data/errors/i18n/pl/dishwashers.json'
import plTd from '../../data/errors/i18n/pl/tumble-dryers.json'
import plFr from '../../data/errors/i18n/pl/fridges.json'
import plCm from '../../data/errors/i18n/pl/coffee-machines.json'
import plAc from '../../data/errors/i18n/pl/air-conditioners.json'
import plBo from '../../data/errors/i18n/pl/boilers.json'
import ptbrW from '../../data/errors/i18n/pt-br/washing-machines.json'
import ptbrD from '../../data/errors/i18n/pt-br/dishwashers.json'
import ptbrTd from '../../data/errors/i18n/pt-br/tumble-dryers.json'
import ptbrFr from '../../data/errors/i18n/pt-br/fridges.json'
import ptbrCm from '../../data/errors/i18n/pt-br/coffee-machines.json'
import ptbrAc from '../../data/errors/i18n/pt-br/air-conditioners.json'
import ptbrBo from '../../data/errors/i18n/pt-br/boilers.json'
import trW from '../../data/errors/i18n/tr/washing-machines.json'
import trD from '../../data/errors/i18n/tr/dishwashers.json'
import trTd from '../../data/errors/i18n/tr/tumble-dryers.json'
import trFr from '../../data/errors/i18n/tr/fridges.json'
import trCm from '../../data/errors/i18n/tr/coffee-machines.json'
import trAc from '../../data/errors/i18n/tr/air-conditioners.json'
import trBo from '../../data/errors/i18n/tr/boilers.json'
import csW from '../../data/errors/i18n/cs/washing-machines.json'
import csD from '../../data/errors/i18n/cs/dishwashers.json'
import csTd from '../../data/errors/i18n/cs/tumble-dryers.json'
import csFr from '../../data/errors/i18n/cs/fridges.json'
import csCm from '../../data/errors/i18n/cs/coffee-machines.json'
import csAc from '../../data/errors/i18n/cs/air-conditioners.json'
import csBo from '../../data/errors/i18n/cs/boilers.json'
import ukW from '../../data/errors/i18n/uk/washing-machines.json'
import ukD from '../../data/errors/i18n/uk/dishwashers.json'
import ukTd from '../../data/errors/i18n/uk/tumble-dryers.json'
import ukFr from '../../data/errors/i18n/uk/fridges.json'
import ukCm from '../../data/errors/i18n/uk/coffee-machines.json'
import ukAc from '../../data/errors/i18n/uk/air-conditioners.json'
import ukBo from '../../data/errors/i18n/uk/boilers.json'
import svW from '../../data/errors/i18n/sv/washing-machines.json'
import svD from '../../data/errors/i18n/sv/dishwashers.json'
import svTd from '../../data/errors/i18n/sv/tumble-dryers.json'
import svFr from '../../data/errors/i18n/sv/fridges.json'
import svCm from '../../data/errors/i18n/sv/coffee-machines.json'
import svAc from '../../data/errors/i18n/sv/air-conditioners.json'
import svBo from '../../data/errors/i18n/sv/boilers.json'
import jaW from '../../data/errors/i18n/ja/washing-machines.json'
import jaD from '../../data/errors/i18n/ja/dishwashers.json'
import jaTd from '../../data/errors/i18n/ja/tumble-dryers.json'
import jaFr from '../../data/errors/i18n/ja/fridges.json'
import jaCm from '../../data/errors/i18n/ja/coffee-machines.json'
import jaAc from '../../data/errors/i18n/ja/air-conditioners.json'
import jaBo from '../../data/errors/i18n/ja/boilers.json'
import roW from '../../data/errors/i18n/ro/washing-machines.json'
import roD from '../../data/errors/i18n/ro/dishwashers.json'
import roTd from '../../data/errors/i18n/ro/tumble-dryers.json'
import roFr from '../../data/errors/i18n/ro/fridges.json'
import roCm from '../../data/errors/i18n/ro/coffee-machines.json'
import roAc from '../../data/errors/i18n/ro/air-conditioners.json'
import roBo from '../../data/errors/i18n/ro/boilers.json'
import daW from '../../data/errors/i18n/da/washing-machines.json'
import daD from '../../data/errors/i18n/da/dishwashers.json'
import daTd from '../../data/errors/i18n/da/tumble-dryers.json'
import daFr from '../../data/errors/i18n/da/fridges.json'
import daCm from '../../data/errors/i18n/da/coffee-machines.json'
import daAc from '../../data/errors/i18n/da/air-conditioners.json'
import daBo from '../../data/errors/i18n/da/boilers.json'
import fiW from '../../data/errors/i18n/fi/washing-machines.json'
import fiD from '../../data/errors/i18n/fi/dishwashers.json'
import fiTd from '../../data/errors/i18n/fi/tumble-dryers.json'
import fiFr from '../../data/errors/i18n/fi/fridges.json'
import fiCm from '../../data/errors/i18n/fi/coffee-machines.json'
import fiAc from '../../data/errors/i18n/fi/air-conditioners.json'
import fiBo from '../../data/errors/i18n/fi/boilers.json'
import nbW from '../../data/errors/i18n/nb/washing-machines.json'
import nbD from '../../data/errors/i18n/nb/dishwashers.json'
import nbTd from '../../data/errors/i18n/nb/tumble-dryers.json'
import nbFr from '../../data/errors/i18n/nb/fridges.json'
import nbCm from '../../data/errors/i18n/nb/coffee-machines.json'
import nbAc from '../../data/errors/i18n/nb/air-conditioners.json'
import nbBo from '../../data/errors/i18n/nb/boilers.json'
import arW from '../../data/errors/i18n/ar/washing-machines.json'
import arD from '../../data/errors/i18n/ar/dishwashers.json'
import arTd from '../../data/errors/i18n/ar/tumble-dryers.json'
import arFr from '../../data/errors/i18n/ar/fridges.json'
import arCm from '../../data/errors/i18n/ar/coffee-machines.json'
import arAc from '../../data/errors/i18n/ar/air-conditioners.json'
import arBo from '../../data/errors/i18n/ar/boilers.json'
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
  nl: { 'washing-machines': nlW, 'dishwashers': nlD, 'tumble-dryers': nlTd, 'fridges': nlFr, 'coffee-machines': nlCm, 'air-conditioners': nlAc, 'boilers': nlBo },
  pl: { 'washing-machines': plW, 'dishwashers': plD, 'tumble-dryers': plTd, 'fridges': plFr, 'coffee-machines': plCm, 'air-conditioners': plAc, 'boilers': plBo },
  'pt-br': { 'washing-machines': ptbrW, 'dishwashers': ptbrD, 'tumble-dryers': ptbrTd, 'fridges': ptbrFr, 'coffee-machines': ptbrCm, 'air-conditioners': ptbrAc, 'boilers': ptbrBo },
  tr: { 'washing-machines': trW, 'dishwashers': trD, 'tumble-dryers': trTd, 'fridges': trFr, 'coffee-machines': trCm, 'air-conditioners': trAc, 'boilers': trBo },
  cs: { 'washing-machines': csW, 'dishwashers': csD, 'tumble-dryers': csTd, 'fridges': csFr, 'coffee-machines': csCm, 'air-conditioners': csAc, 'boilers': csBo },
  uk: { 'washing-machines': ukW, 'dishwashers': ukD, 'tumble-dryers': ukTd, 'fridges': ukFr, 'coffee-machines': ukCm, 'air-conditioners': ukAc, 'boilers': ukBo },
  sv: { 'washing-machines': svW, 'dishwashers': svD, 'tumble-dryers': svTd, 'fridges': svFr, 'coffee-machines': svCm, 'air-conditioners': svAc, 'boilers': svBo },
  ja: { 'washing-machines': jaW, 'dishwashers': jaD, 'tumble-dryers': jaTd, 'fridges': jaFr, 'coffee-machines': jaCm, 'air-conditioners': jaAc, 'boilers': jaBo },
  ro: { 'washing-machines': roW, 'dishwashers': roD, 'tumble-dryers': roTd, 'fridges': roFr, 'coffee-machines': roCm, 'air-conditioners': roAc, 'boilers': roBo },
  da: { 'washing-machines': daW, 'dishwashers': daD, 'tumble-dryers': daTd, 'fridges': daFr, 'coffee-machines': daCm, 'air-conditioners': daAc, 'boilers': daBo },
  fi: { 'washing-machines': fiW, 'dishwashers': fiD, 'tumble-dryers': fiTd, 'fridges': fiFr, 'coffee-machines': fiCm, 'air-conditioners': fiAc, 'boilers': fiBo },
  nb: { 'washing-machines': nbW, 'dishwashers': nbD, 'tumble-dryers': nbTd, 'fridges': nbFr, 'coffee-machines': nbCm, 'air-conditioners': nbAc, 'boilers': nbBo },
  ar: { 'washing-machines': arW, 'dishwashers': arD, 'tumble-dryers': arTd, 'fridges': arFr, 'coffee-machines': arCm, 'air-conditioners': arAc, 'boilers': arBo },
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
  nl: { 'washing-machines': { one: 'wasmachine', many: 'Wasmachines', slug: 'wasmachines' }, 'dishwashers': { one: 'vaatwasser', many: 'Vaatwassers', slug: 'vaatwassers' }, 'tumble-dryers': { one: 'droger', many: 'Wasdrogers', slug: 'wasdrogers' }, 'fridges': { one: 'koelkast', many: 'Koelkasten', slug: 'koelkasten' }, 'coffee-machines': { one: 'koffiemachine', many: 'Koffiemachines', slug: 'koffiemachines' }, 'air-conditioners': { one: 'airco', many: 'Airco’s', slug: 'airco' }, 'boilers': { one: 'cv-ketel', many: 'Cv-ketels', slug: 'cv-ketels' } },
  pl: { 'washing-machines': { one: 'pralka', many: 'Pralki', slug: 'pralki' }, 'dishwashers': { one: 'zmywarka', many: 'Zmywarki', slug: 'zmywarki' }, 'tumble-dryers': { one: 'suszarka', many: 'Suszarki do ubrań', slug: 'suszarki' }, 'fridges': { one: 'lodówka', many: 'Lodówki', slug: 'lodowki' }, 'coffee-machines': { one: 'ekspres do kawy', many: 'Ekspresy do kawy', slug: 'ekspresy-do-kawy' }, 'air-conditioners': { one: 'klimatyzator', many: 'Klimatyzatory', slug: 'klimatyzatory' }, 'boilers': { one: 'kocioł gazowy', many: 'Kotły gazowe', slug: 'kotly-gazowe' } },
  'pt-br': { 'washing-machines': { one: 'lavadora', many: 'Lavadoras', slug: 'lavadoras' }, 'dishwashers': { one: 'lava-louças', many: 'Lava-louças', slug: 'lava-loucas' }, 'tumble-dryers': { one: 'secadora', many: 'Secadoras', slug: 'secadoras' }, 'fridges': { one: 'geladeira', many: 'Geladeiras', slug: 'geladeiras' }, 'coffee-machines': { one: 'cafeteira', many: 'Cafeteiras', slug: 'cafeteiras' }, 'air-conditioners': { one: 'ar-condicionado', many: 'Ar-condicionado', slug: 'ar-condicionado' }, 'boilers': { one: 'caldeira a gás', many: 'Caldeiras a gás', slug: 'caldeiras' } },
  tr: { 'washing-machines': { one: 'çamaşır makinesi', many: 'Çamaşır makineleri', slug: 'camasir-makineleri' }, 'dishwashers': { one: 'bulaşık makinesi', many: 'Bulaşık makineleri', slug: 'bulasik-makineleri' }, 'tumble-dryers': { one: 'kurutma makinesi', many: 'Kurutma makineleri', slug: 'kurutma-makineleri' }, 'fridges': { one: 'buzdolabı', many: 'Buzdolapları', slug: 'buzdolaplari' }, 'coffee-machines': { one: 'kahve makinesi', many: 'Kahve makineleri', slug: 'kahve-makineleri' }, 'air-conditioners': { one: 'klima', many: 'Klimalar', slug: 'klimalar' }, 'boilers': { one: 'kombi', many: 'Kombiler', slug: 'kombiler' } },
  cs: { 'washing-machines': { one: 'pračka', many: 'Pračky', slug: 'pracky' }, 'dishwashers': { one: 'myčka', many: 'Myčky', slug: 'mycky' }, 'tumble-dryers': { one: 'sušička', many: 'Sušičky', slug: 'susicky' }, 'fridges': { one: 'lednice', many: 'Lednice', slug: 'lednice' }, 'coffee-machines': { one: 'kávovar', many: 'Kávovary', slug: 'kavovary' }, 'air-conditioners': { one: 'klimatizace', many: 'Klimatizace', slug: 'klimatizace' }, 'boilers': { one: 'plynový kotel', many: 'Plynové kotle', slug: 'plynove-kotle' } },
  uk: { 'washing-machines': { one: 'пральна машина', many: 'Пральні машини', slug: 'pralni-mashyny' }, 'dishwashers': { one: 'посудомийна машина', many: 'Посудомийні машини', slug: 'posudomyini-mashyny' }, 'tumble-dryers': { one: 'сушильна машина', many: 'Сушильні машини', slug: 'sushylni-mashyny' }, 'fridges': { one: 'холодильник', many: 'Холодильники', slug: 'kholodylnyky' }, 'coffee-machines': { one: 'кавомашина', many: 'Кавомашини', slug: 'kavomashyny' }, 'air-conditioners': { one: 'кондиціонер', many: 'Кондиціонери', slug: 'kondytsionery' }, 'boilers': { one: 'газовий котел', many: 'Газові котли', slug: 'hazovi-kotly' } },
  sv: { 'washing-machines': { one: 'tvättmaskin', many: 'Tvättmaskiner', slug: 'tvattmaskiner' }, 'dishwashers': { one: 'diskmaskin', many: 'Diskmaskiner', slug: 'diskmaskiner' }, 'tumble-dryers': { one: 'torktumlare', many: 'Torktumlare', slug: 'torktumlare' }, 'fridges': { one: 'kylskåp', many: 'Kylskåp', slug: 'kylskap' }, 'coffee-machines': { one: 'kaffemaskin', many: 'Kaffemaskiner', slug: 'kaffemaskiner' }, 'air-conditioners': { one: 'luftkonditionering', many: 'Luftkonditionering', slug: 'luftkonditionering' }, 'boilers': { one: 'gaspanna', many: 'Gaspannor', slug: 'gaspannor' } },
  ja: { 'washing-machines': { one: '洗濯機', many: '洗濯機', slug: 'washing-machines' }, 'dishwashers': { one: '食器洗い乾燥機', many: '食器洗い乾燥機', slug: 'dishwashers' }, 'tumble-dryers': { one: '衣類乾燥機', many: '衣類乾燥機', slug: 'tumble-dryers' }, 'fridges': { one: '冷蔵庫', many: '冷蔵庫', slug: 'fridges' }, 'coffee-machines': { one: 'コーヒーメーカー', many: 'コーヒーメーカー', slug: 'coffee-machines' }, 'air-conditioners': { one: 'エアコン', many: 'エアコン', slug: 'air-conditioners' }, 'boilers': { one: 'ガスボイラー', many: 'ガスボイラー', slug: 'boilers' } },
  ro: { 'washing-machines': { one: 'mașină de spălat', many: 'Mașini de spălat', slug: 'masini-de-spalat' }, 'dishwashers': { one: 'mașină de spălat vase', many: 'Mașini de spălat vase', slug: 'masini-de-spalat-vase' }, 'tumble-dryers': { one: 'uscător de rufe', many: 'Uscătoare de rufe', slug: 'uscatoare-de-rufe' }, 'fridges': { one: 'frigider', many: 'Frigidere', slug: 'frigidere' }, 'coffee-machines': { one: 'espressor', many: 'Espressoare', slug: 'espressoare' }, 'air-conditioners': { one: 'aer condiționat', many: 'Aere condiționate', slug: 'aer-conditionat' }, 'boilers': { one: 'centrală termică', many: 'Centrale termice', slug: 'centrale-termice' } },
  da: { 'washing-machines': { one: 'vaskemaskine', many: 'Vaskemaskiner', slug: 'vaskemaskiner' }, 'dishwashers': { one: 'opvaskemaskine', many: 'Opvaskemaskiner', slug: 'opvaskemaskiner' }, 'tumble-dryers': { one: 'tørretumbler', many: 'Tørretumblere', slug: 'toerretumblere' }, 'fridges': { one: 'køleskab', many: 'Køleskabe', slug: 'koeleskabe' }, 'coffee-machines': { one: 'kaffemaskine', many: 'Kaffemaskiner', slug: 'kaffemaskiner' }, 'air-conditioners': { one: 'aircondition', many: 'Aircondition', slug: 'aircondition' }, 'boilers': { one: 'gasfyr', many: 'Gasfyr', slug: 'gasfyr' } },
  fi: { 'washing-machines': { one: 'pesukone', many: 'Pesukoneet', slug: 'pesukoneet' }, 'dishwashers': { one: 'astianpesukone', many: 'Astianpesukoneet', slug: 'astianpesukoneet' }, 'tumble-dryers': { one: 'kuivausrumpu', many: 'Kuivausrummut', slug: 'kuivausrummut' }, 'fridges': { one: 'jääkaappi', many: 'Jääkaapit', slug: 'jaakaapit' }, 'coffee-machines': { one: 'kahvikone', many: 'Kahvikoneet', slug: 'kahvikoneet' }, 'air-conditioners': { one: 'ilmalämpöpumppu', many: 'Ilmalämpöpumput', slug: 'ilmalampopumput' }, 'boilers': { one: 'kaasukattila', many: 'Kaasukattilat', slug: 'kaasukattilat' } },
  nb: { 'washing-machines': { one: 'vaskemaskin', many: 'Vaskemaskiner', slug: 'vaskemaskiner' }, 'dishwashers': { one: 'oppvaskmaskin', many: 'Oppvaskmaskiner', slug: 'oppvaskmaskiner' }, 'tumble-dryers': { one: 'tørketrommel', many: 'Tørketromler', slug: 'torketromler' }, 'fridges': { one: 'kjøleskap', many: 'Kjøleskap', slug: 'kjoleskap' }, 'coffee-machines': { one: 'kaffemaskin', many: 'Kaffemaskiner', slug: 'kaffemaskiner' }, 'air-conditioners': { one: 'varmepumpe', many: 'Varmepumper', slug: 'varmepumper' }, 'boilers': { one: 'gasskjele', many: 'Gasskjeler', slug: 'gasskjeler' } },
  ar: { 'washing-machines': { one: 'غسالة ملابس', many: 'غسالات الملابس', slug: 'washing-machines' }, 'dishwashers': { one: 'غسالة صحون', many: 'غسالات الصحون', slug: 'dishwashers' }, 'tumble-dryers': { one: 'مجفف ملابس', many: 'مجففات الملابس', slug: 'tumble-dryers' }, 'fridges': { one: 'ثلاجة', many: 'الثلاجات', slug: 'fridges' }, 'coffee-machines': { one: 'ماكينة قهوة', many: 'ماكينات القهوة', slug: 'coffee-machines' }, 'air-conditioners': { one: 'مكيف هواء', many: 'مكيفات الهواء', slug: 'air-conditioners' }, 'boilers': { one: 'غلاية غاز', many: 'غلايات الغاز', slug: 'boilers' } },
}
export const applianceName = (lang: Locale, a: Appliance) => (APPLIANCE_NAMES[lang] ?? APPLIANCE_NAMES.en!)[a]
