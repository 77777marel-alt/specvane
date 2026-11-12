import type { Locale } from './i18n/config'
import en from '../../data/rights/en.json'
import de from '../../data/rights/de.json'
import fr from '../../data/rights/fr.json'
import it from '../../data/rights/it.json'
import es from '../../data/rights/es.json'
import nl from '../../data/rights/nl.json'
import pl from '../../data/rights/pl.json'
import sv from '../../data/rights/sv.json'
import el from '../../data/rights/el.json'
import cs from '../../data/rights/cs.json'
import ro from '../../data/rights/ro.json'
import da from '../../data/rights/da.json'
import fi from '../../data/rights/fi.json'
import nb from '../../data/rights/nb.json'
import ru from '../../data/rights/ru.json'
import uk from '../../data/rights/uk.json'

// «Покупка в ЕС: ваши права» — общий пересказ законов ЕС для типа товара, БЕЗ сроков и без оценки модели
// (никаких прогнозов «сколько прослужит» — чтобы не было претензий производителей). Ссылки — официальные тексты EUR-Lex.
type RightsText = typeof en
const T: Partial<Record<Locale, RightsText>> = { en, de, fr, it, es, nl, pl, sv, el, cs, ro, da, fi, nb, ru, uk }
// языки, читатели которых в основном покупают в ЕС/ЕЭЗ (pt-br, ja, tr, ar — другие рынки)
export const rightsText = (l: Locale): RightsText | null => T[l] ?? null

const EURLEX: Partial<Record<Locale, string>> = { en: 'eng', de: 'deu', fr: 'fra', it: 'ita', es: 'spa', nl: 'nld', pl: 'pol', sv: 'swe', el: 'ell', cs: 'ces', ro: 'ron', da: 'dan', fi: 'fin' }
const lx = (lang: Locale, path: string) => `https://eur-lex.europa.eu/eli/${path}/oj/${EURLEX[lang] ?? 'eng'}`

// регламенты экодизайна (запчасти и информация для ремонта) по категориям каталога
const ECO: Record<string, string> = {
  smartphones: 'reg/2023/1670', tablets: 'reg/2023/1670',
  'washing-machines': 'reg/2019/2023', 'washer-dryers': 'reg/2019/2023', dishwashers: 'reg/2019/2022',
  fridges: 'reg/2019/2019', 'fridges-1323': 'reg/2019/2019', freezers: 'reg/2019/2019', 'wine-coolers': 'reg/2019/2019',
  tvs: 'reg/2019/2021', monitors: 'reg/2019/2021', 'tumble-dryers': 'reg/2023/2533',
}
// право на ремонт после гарантии (Директива 2024/1799, приложение II) — только категории, где мы уверены
const R2R = new Set(['smartphones', 'tablets', 'washing-machines', 'washer-dryers', 'dishwashers', 'fridges', 'fridges-1323', 'freezers', 'wine-coolers', 'tvs', 'monitors'])

export type RightsItem = { text: string; href: string }
export function rightsFor(lang: Locale, cat: string): { t: RightsText; items: RightsItem[] } | null {
  const t = rightsText(lang)
  if (!t) return null
  const items: RightsItem[] = [{ text: t.guarantee, href: lx(lang, 'dir/2019/771') }]
  const eco = ECO[cat]
  if (eco) {
    items.push({ text: t.spare, href: lx(lang, eco) }, { text: t.repairInfo, href: lx(lang, eco) })
    if (cat === 'smartphones' || cat === 'tablets') items.push({ text: t.updates, href: lx(lang, eco) })
  }
  if (R2R.has(cat)) items.push({ text: t.repair, href: lx(lang, 'dir/2024/1799') })
  return { t, items }
}
