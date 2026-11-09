// Разделы сайта с адресами на языке страны (vergleich, beste, ratgeber…).
// Модели и бренды в адресах не переводятся. Файл без server-only: нужен и переключателю языка.
import { LOCALES, type Locale } from './i18n/config'

export const SECTIONS = ['compare', 'best', 'brands', 'new', 'alternatives', 'guides', 'errors'] as const
export const INFO_PAGES = ['about', 'how-we-make-money', 'privacy', 'cookies', 'contact', 'legal-notice'] as const
export type Section = (typeof SECTIONS)[number]
export type InfoPage = (typeof INFO_PAGES)[number]
type Key = Section | InfoPage

export const SLUGS: Record<Locale, Record<Key, string>> = {
  en: { errors: 'error-codes', compare: 'compare', best: 'best', brands: 'brands', new: 'new', alternatives: 'alternatives', guides: 'guides',
    about: 'about', 'how-we-make-money': 'how-we-make-money', privacy: 'privacy', cookies: 'cookies', contact: 'contact', 'legal-notice': 'legal-notice' },
  de: { errors: 'fehlercodes', compare: 'vergleich', best: 'beste', brands: 'marken', new: 'neu', alternatives: 'alternativen', guides: 'ratgeber',
    about: 'ueber-uns', 'how-we-make-money': 'wie-wir-geld-verdienen', privacy: 'datenschutz', cookies: 'cookies', contact: 'kontakt', 'legal-notice': 'impressum' },
  fr: { errors: 'codes-erreur', compare: 'comparatif', best: 'meilleurs', brands: 'marques', new: 'nouveautes', alternatives: 'alternatives', guides: 'guides-achat',
    about: 'a-propos', 'how-we-make-money': 'comment-nous-gagnons-de-l-argent', privacy: 'confidentialite', cookies: 'cookies', contact: 'contact', 'legal-notice': 'mentions-legales' },
  it: { errors: 'codici-errore', compare: 'confronto', best: 'migliori', brands: 'marche', new: 'novita', alternatives: 'alternative', guides: 'guide',
    about: 'chi-siamo', 'how-we-make-money': 'come-guadagniamo', privacy: 'privacy', cookies: 'cookie', contact: 'contatti', 'legal-notice': 'note-legali' },
  es: { errors: 'codigos-error', compare: 'comparativa', best: 'mejores', brands: 'marcas', new: 'novedades', alternatives: 'alternativas', guides: 'guias',
    about: 'sobre-nosotros', 'how-we-make-money': 'como-ganamos-dinero', privacy: 'privacidad', cookies: 'cookies', contact: 'contacto', 'legal-notice': 'aviso-legal' },
  nl: { errors: 'foutcodes', compare: 'vergelijken', best: 'beste', brands: 'merken', new: 'nieuw', alternatives: 'alternatieven', guides: 'koopgids',
    about: 'over-ons', 'how-we-make-money': 'hoe-we-geld-verdienen', privacy: 'privacy', cookies: 'cookies', contact: 'contact', 'legal-notice': 'colofon' },
  pl: { errors: 'kody-bledow', compare: 'porownanie', best: 'najlepsze', brands: 'marki', new: 'nowosci', alternatives: 'alternatywy', guides: 'poradnik',
    about: 'o-nas', 'how-we-make-money': 'jak-zarabiamy', privacy: 'prywatnosc', cookies: 'cookies', contact: 'kontakt', 'legal-notice': 'nota-prawna' },
  sv: { errors: 'felkoder', compare: 'jamforelse', best: 'basta', brands: 'marken', new: 'nyheter', alternatives: 'alternativ', guides: 'kopguide',
    about: 'om-oss', 'how-we-make-money': 'hur-vi-tjanar-pengar', privacy: 'integritet', cookies: 'cookies', contact: 'kontakt', 'legal-notice': 'juridisk-information' },
  'pt-br': { errors: 'codigos-de-erro', compare: 'comparacao', best: 'melhores', brands: 'marcas', new: 'novidades', alternatives: 'alternativas', guides: 'guias',
    about: 'sobre', 'how-we-make-money': 'como-ganhamos-dinheiro', privacy: 'privacidade', cookies: 'cookies', contact: 'contato', 'legal-notice': 'aviso-legal' },
  ja: { errors: 'error-codes', compare: 'compare', best: 'best', brands: 'brands', new: 'new', alternatives: 'alternatives', guides: 'guides',
    about: 'about', 'how-we-make-money': 'how-we-make-money', privacy: 'privacy', cookies: 'cookies', contact: 'contact', 'legal-notice': 'legal-notice' },
  tr: { errors: 'hata-kodlari', compare: 'karsilastirma', best: 'en-iyiler', brands: 'markalar', new: 'yeni', alternatives: 'alternatifler', guides: 'rehberler', about: 'hakkimizda', 'how-we-make-money': 'nasil-para-kazaniyoruz', privacy: 'gizlilik', cookies: 'cerezler', contact: 'iletisim', 'legal-notice': 'yasal-bilgiler' },
  el: { errors: 'kodikoi-sfalmaton', compare: 'sygkrisi', best: 'kalytera', brands: 'markes', new: 'nea', alternatives: 'enallaktikes', guides: 'odigoi-agoras', about: 'sxetika', 'how-we-make-money': 'pos-kerdizoume', privacy: 'aporrito', cookies: 'cookies', contact: 'epikoinonia', 'legal-notice': 'nomikes-plirofories' },
  cs: { errors: 'chybove-kody', compare: 'porovnani', best: 'nejlepsi', brands: 'znacky', new: 'novinky', alternatives: 'alternativy', guides: 'nakupni-radce', about: 'o-nas', 'how-we-make-money': 'jak-vydelavame', privacy: 'ochrana-soukromi', cookies: 'cookies', contact: 'kontakt', 'legal-notice': 'pravni-informace' },
  ro: { errors: 'coduri-eroare', compare: 'comparatie', best: 'cele-mai-bune', brands: 'marci', new: 'noutati', alternatives: 'alternative', guides: 'ghiduri', about: 'despre-noi', 'how-we-make-money': 'cum-castigam-bani', privacy: 'confidentialitate', cookies: 'cookie-uri', contact: 'contact', 'legal-notice': 'informatii-legale' },
  da: { errors: 'fejlkoder', compare: 'sammenligning', best: 'bedste', brands: 'maerker', new: 'nyheder', alternatives: 'alternativer', guides: 'koebsguides', about: 'om-os', 'how-we-make-money': 'saadan-tjener-vi-penge', privacy: 'privatliv', cookies: 'cookies', contact: 'kontakt', 'legal-notice': 'juridisk-information' },
  fi: { errors: 'virhekoodit', compare: 'vertailu', best: 'parhaat', brands: 'merkit', new: 'uutuudet', alternatives: 'vaihtoehdot', guides: 'ostooppaat', about: 'tietoa-meista', 'how-we-make-money': 'miten-ansaitsemme', privacy: 'tietosuoja', cookies: 'evasteet', contact: 'yhteystiedot', 'legal-notice': 'oikeudelliset-tiedot' },
  nb: { errors: 'feilkoder', compare: 'sammenligning', best: 'beste', brands: 'merker', new: 'nyheter', alternatives: 'alternativer', guides: 'kjopeguider', about: 'om-oss', 'how-we-make-money': 'slik-tjener-vi-penger', privacy: 'personvern', cookies: 'informasjonskapsler', contact: 'kontakt', 'legal-notice': 'juridisk-informasjon' },
  ru: { errors: 'kody-oshibok', compare: 'sravnenie', best: 'luchshie', brands: 'brendy', new: 'novinki', alternatives: 'alternativy', guides: 'kak-vybrat', about: 'o-nas', 'how-we-make-money': 'kak-my-zarabatyvaem', privacy: 'konfidencialnost', cookies: 'cookies', contact: 'kontakty', 'legal-notice': 'pravovaya-informaciya' },
  uk: { errors: 'kody-pomylok', compare: 'porivnyannya', best: 'naykrashchi', brands: 'brendy', new: 'novynky', alternatives: 'alternatyvy', guides: 'yak-obraty', about: 'pro-nas', 'how-we-make-money': 'yak-my-zaroblyayemo', privacy: 'konfidentsiynist', cookies: 'cookies', contact: 'kontakty', 'legal-notice': 'pravova-informatsiya' },
  ar: { errors: 'rumuz-al-akhta', compare: 'muqarana', best: 'al-afdal', brands: 'al-alamat', new: 'jadid', alternatives: 'badail', guides: 'adillat-al-shira', about: 'man-nahnu', 'how-we-make-money': 'kayfa-narbah', privacy: 'al-khususiya', cookies: 'cookies', contact: 'ittasil-bina', 'legal-notice': 'ishaar-qanuni' },
}

export function sectionHref(lang: Locale, key: Key, ...rest: string[]): string {
  return ['', lang, SLUGS[lang][key], ...rest].join('/')
}

/** Что за раздел у первого сегмента адреса в этом языке (или null — значит, категория). */
export function resolveSlug(lang: Locale, slug: string): Key | null {
  const map = SLUGS[lang]
  for (const k of Object.keys(map) as Key[]) if (map[k] === slug) return k
  return null
}

/** Тот же раздел на другом языке. Для товаров/категорий нужна база — тогда главная языка. */
export function translatePath(path: string, from: Locale, to: Locale): string {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0 || parts[0] !== from) return `/${to}`
  if (parts.length === 1) return `/${to}`
  const key = resolveSlug(from, parts[1])
  if (key && parts.length === 2) return sectionHref(to, key)
  return `/${to}`
}

export const ALL_LOCALES = LOCALES
