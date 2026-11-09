// Языки и рынки Specvane. Добавить язык = добавить строку сюда + словарь в ./dict.
export const LOCALES = ['en', 'de', 'fr', 'it', 'es', 'nl', 'pl', 'sv', 'pt-br', 'ja', 'tr', 'el', 'cs', 'ro', 'da', 'fi', 'nb', 'ru', 'uk', 'ar'] as const
/** языки с письмом справа налево */
export const RTL: readonly string[] = ['ar']
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v)

type Market = {
  /** значение для <html lang> и hreflang */
  hreflang: string
  /** название языка на самом языке — для переключателя */
  nativeName: string
  /** основной магазин Amazon и страны, которым он подходит */
  amazon: { domain: string; countries: string[] }[]
  /** валюта по умолчанию (для подборок «до 500 €») */
  currency: string
  /** страна по умолчанию для цен на странице (текст для Google одинаковый) */
  defaultCountry: string
}

export const MARKETS: Record<Locale, Market> = {
  en: {
    hreflang: 'en', nativeName: 'English', currency: 'USD', defaultCountry: 'US',
    amazon: [
      { domain: 'amazon.com', countries: ['US'] },
      { domain: 'amazon.co.uk', countries: ['GB', 'IE'] },
      { domain: 'amazon.ca', countries: ['CA'] },
      { domain: 'amazon.com.au', countries: ['AU', 'NZ'] },
    ],
  },
  de: { hreflang: 'de', nativeName: 'Deutsch', currency: 'EUR', defaultCountry: 'DE', amazon: [{ domain: 'amazon.de', countries: ['DE', 'AT', 'CH'] }] },
  fr: { hreflang: 'fr', nativeName: 'Français', currency: 'EUR', defaultCountry: 'FR', amazon: [{ domain: 'amazon.fr', countries: ['FR', 'LU'] }, { domain: 'amazon.com.be', countries: ['BE'] }] },
  it: { hreflang: 'it', nativeName: 'Italiano', currency: 'EUR', defaultCountry: 'IT', amazon: [{ domain: 'amazon.it', countries: ['IT'] }] },
  es: { hreflang: 'es', nativeName: 'Español', currency: 'EUR', defaultCountry: 'ES', amazon: [{ domain: 'amazon.es', countries: ['ES'] }, { domain: 'amazon.com.mx', countries: ['MX'] }] },
  nl: { hreflang: 'nl', nativeName: 'Nederlands', currency: 'EUR', defaultCountry: 'NL', amazon: [{ domain: 'amazon.nl', countries: ['NL'] }, { domain: 'amazon.com.be', countries: ['BE'] }] },
  pl: { hreflang: 'pl', nativeName: 'Polski', currency: 'PLN', defaultCountry: 'PL', amazon: [{ domain: 'amazon.pl', countries: ['PL'] }] },
  sv: { hreflang: 'sv', nativeName: 'Svenska', currency: 'SEK', defaultCountry: 'SE', amazon: [{ domain: 'amazon.se', countries: ['SE'] }] },
  'pt-br': { hreflang: 'pt-BR', nativeName: 'Português (Brasil)', currency: 'BRL', defaultCountry: 'BR', amazon: [{ domain: 'amazon.com.br', countries: ['BR'] }] },
  ja: { hreflang: 'ja', nativeName: '日本語', currency: 'JPY', defaultCountry: 'JP', amazon: [{ domain: 'amazon.co.jp', countries: ['JP'] }] },
  // волна 2 (09.11.2026). Где своего Amazon нет — ближайший, который доставляет в страну; позже местные магазины (Awin и др.)
  tr: { hreflang: 'tr', nativeName: 'Türkçe', currency: 'TRY', defaultCountry: 'TR', amazon: [{ domain: 'amazon.com.tr', countries: ['TR'] }] },
  el: { hreflang: 'el', nativeName: 'Ελληνικά', currency: 'EUR', defaultCountry: 'GR', amazon: [{ domain: 'amazon.de', countries: ['GR', 'CY'] }] },
  cs: { hreflang: 'cs', nativeName: 'Čeština', currency: 'CZK', defaultCountry: 'CZ', amazon: [{ domain: 'amazon.de', countries: ['CZ'] }] },
  ro: { hreflang: 'ro', nativeName: 'Română', currency: 'RON', defaultCountry: 'RO', amazon: [{ domain: 'amazon.de', countries: ['RO', 'MD'] }] },
  da: { hreflang: 'da', nativeName: 'Dansk', currency: 'DKK', defaultCountry: 'DK', amazon: [{ domain: 'amazon.de', countries: ['DK'] }] },
  fi: { hreflang: 'fi', nativeName: 'Suomi', currency: 'EUR', defaultCountry: 'FI', amazon: [{ domain: 'amazon.de', countries: ['FI'] }] },
  nb: { hreflang: 'nb', nativeName: 'Norsk', currency: 'NOK', defaultCountry: 'NO', amazon: [{ domain: 'amazon.se', countries: ['NO'] }] },
  ru: { hreflang: 'ru', nativeName: 'Русский', currency: 'EUR', defaultCountry: 'DE', amazon: [{ domain: 'amazon.de', countries: ['DE', 'AT', 'CY', 'LV', 'EE', 'LT'] }] },
  uk: { hreflang: 'uk', nativeName: 'Українська', currency: 'UAH', defaultCountry: 'UA', amazon: [{ domain: 'amazon.pl', countries: ['UA', 'PL'] }] },
  ar: { hreflang: 'ar', nativeName: 'العربية', currency: 'AED', defaultCountry: 'AE', amazon: [{ domain: 'amazon.ae', countries: ['AE'] }, { domain: 'amazon.sa', countries: ['SA'] }, { domain: 'amazon.eg', countries: ['EG'] }] },
}

/** Магазин Amazon для кнопки «Купить» по стране посетителя (заголовок Vercel). */
export function amazonDomainFor(locale: Locale, country?: string | null): string {
  const m = MARKETS[locale]
  if (country) {
    const hit = m.amazon.find((a) => a.countries.includes(country.toUpperCase()))
    if (hit) return hit.domain
  }
  return m.amazon[0].domain
}
