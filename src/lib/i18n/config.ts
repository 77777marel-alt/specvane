// Языки и рынки Specvane. Добавить язык = добавить строку сюда + словарь в ./dict.
export const LOCALES = ['en', 'de', 'fr', 'it', 'es', 'nl', 'pl', 'sv', 'pt-br', 'ja'] as const
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
