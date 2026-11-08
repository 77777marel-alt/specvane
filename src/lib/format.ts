import { MARKETS, type Locale } from './i18n/config'

/** Подстановка {name} в строки словаря. */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))

const intl = (l: Locale) => MARKETS[l].hreflang

export function money(l: Locale, amount: number, currency: string) {
  return new Intl.NumberFormat(intl(l), { style: 'currency', currency, maximumFractionDigits: amount >= 100 ? 0 : 2 }).format(amount)
}

export function number(l: Locale, v: number, digits = 0) {
  return new Intl.NumberFormat(intl(l), { maximumFractionDigits: digits }).format(v)
}

export function date(l: Locale, iso: string) {
  return new Intl.DateTimeFormat(intl(l), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}
