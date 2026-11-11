import type { Locale } from './i18n/config'
import type { SpecValue } from './types'
import type { Support } from './updates'
import { fill } from './format'
import en from '../../data/faq/en.json'
import de from '../../data/faq/de.json'
import fr from '../../data/faq/fr.json'
import it from '../../data/faq/it.json'
import es from '../../data/faq/es.json'
import nl from '../../data/faq/nl.json'
import pl from '../../data/faq/pl.json'
import sv from '../../data/faq/sv.json'
import ptbr from '../../data/faq/pt-br.json'
import ja from '../../data/faq/ja.json'
import tr from '../../data/faq/tr.json'
import el from '../../data/faq/el.json'
import cs from '../../data/faq/cs.json'
import ro from '../../data/faq/ro.json'
import da from '../../data/faq/da.json'
import fi from '../../data/faq/fi.json'
import nb from '../../data/faq/nb.json'
import ru from '../../data/faq/ru.json'
import uk from '../../data/faq/uk.json'
import ar from '../../data/faq/ar.json'

// «Вопросы и ответы» внизу страницы модели — собираются из характеристик (data/faq/<язык>.json — шаблоны).
export type FaqText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, FaqText>
export const faqText = (l: Locale): FaqText => T[l] ?? en

const DIM_W = ['width'], DIM_H = ['height'], DIM_D = ['depth', 'depth_mm', 'thickness'], WEIGHT = ['weight', 'weight_kg']
// подпись характеристики внутри фразы: «Wireless charging» → «wireless charging» (аббревиатуры и немецкие существительные не трогаем)
export const inline = (lang: Locale, s: string) => (lang === 'de' || /^[A-Z0-9]{2}/.test(s) || /^[A-Z][a-z]*[A-Z]/.test(s) ? s : s.charAt(0).toLocaleLowerCase(lang) + s.slice(1))

export function productFaq(lang: Locale, p: { brand: string; name: string; releaseDate?: string | null; keySpecs: SpecValue[]; specs: SpecValue[] },
  extra: { support?: Support | null; manual?: boolean; compare?: string[] }): { q: string; a: string }[] {
  const t = faqText(lang)
  const model = `${p.brand} ${p.name}`
  const month = (d: string) => d.length >= 7 ? new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(`${d.slice(0, 7)}-15`)) : d.slice(0, 4)
  const out: { q: string; a: string }[] = []
  const get = (keys: string[]) => p.specs.find((s) => keys.includes(s.key) && typeof s.value === 'number')
  // 1) главные числовые характеристики
  for (const s of p.keySpecs.filter((x) => typeof x.value === 'number' && ![...DIM_W, ...DIM_H, ...DIM_D, ...WEIGHT].includes(x.key)).slice(0, 4))
    out.push({ q: fill(t.qVal, { spec: inline(lang, s.label), model }), a: fill(t.aVal, { spec: s.label, model, value: s.display }) })
  // 2) да/нет — сначала то, что есть
  const bools = p.specs.filter((s) => typeof s.value === 'boolean')
  for (const s of [...bools.filter((x) => x.value), ...bools.filter((x) => !x.value)].slice(0, 6)) {
    const f = inline(lang, s.label)
    out.push({ q: fill(t.qHas, { model, feature: f }), a: fill(s.value ? t.aYes : t.aNo, { model, feature: f }) })
  }
  // 3) размеры и вес
  const w = get(DIM_W), h = get(DIM_H), d = get(DIM_D)
  if (w && h) out.push({ q: fill(t.qSize, { model }), a: fill(t.aSize, { model, size: [w, h, d].filter(Boolean).map((x) => x!.display).join(' × ') }) })
  const wt = get(WEIGHT)
  if (wt) out.push({ q: fill(t.qWeight, { model }), a: fill(t.aWeight, { model, value: wt.display }) })
  // 4) дата выхода, обновления, инструкция, сравнения
  if (p.releaseDate) out.push({ q: fill(t.qRelease, { model }), a: fill(t.aRelease, { model, date: month(p.releaseDate) }) })
  const sp = extra.support
  if (sp && (sp.securityUntil || sp.osUntil)) out.push({ q: fill(t.qUpdates, { model }),
    a: [sp.securityUntil && fill(t.aSecurity, { date: month(sp.securityUntil) }), sp.osUntil && fill(t.aOs, { date: month(sp.osUntil) }), !sp.official && t.aEstimate].filter(Boolean).join(' ') })
  if (extra.manual) out.push({ q: fill(t.qManual, { model }), a: fill(t.aManual, { model, brand: p.brand }) })
  if (extra.compare?.length) out.push({ q: fill(t.qCompare, { model }), a: fill(t.aCompare, { list: extra.compare.slice(0, 4).join(', ') }) })
  // «март 2026 г..» → одна точка
  return out.map((x) => ({ q: x.q, a: x.a.replace(/\.\.(\s|$)/g, '.$1') }))
}
