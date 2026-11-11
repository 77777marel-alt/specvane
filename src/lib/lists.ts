import type { Locale } from './i18n/config'
import { fill } from './format'
import type { ListDef } from './catalog'
import { inline } from './faq'
import en from '../../data/lists/en.json'
import de from '../../data/lists/de.json'
import fr from '../../data/lists/fr.json'
import it from '../../data/lists/it.json'
import es from '../../data/lists/es.json'
import nl from '../../data/lists/nl.json'
import pl from '../../data/lists/pl.json'
import sv from '../../data/lists/sv.json'
import ptbr from '../../data/lists/pt-br.json'
import ja from '../../data/lists/ja.json'
import tr from '../../data/lists/tr.json'
import el from '../../data/lists/el.json'
import cs from '../../data/lists/cs.json'
import ro from '../../data/lists/ro.json'
import da from '../../data/lists/da.json'
import fi from '../../data/lists/fi.json'
import nb from '../../data/lists/nb.json'
import ru from '../../data/lists/ru.json'
import uk from '../../data/lists/uk.json'
import ar from '../../data/lists/ar.json'

// Тексты подборок (data/lists/<язык>.json).
export type ListsText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, ListsText>
export const listsText = (l: Locale): ListsText => T[l] ?? en
export function listTitle(lang: Locale, category: string, d: ListDef): string {
  const t = listsText(lang)
  return d.kind === 'with' ? fill(t.with, { category, feature: inline(lang, d.label) }) : fill(d.kind === 'min' ? t.min : t.max, { category, spec: inline(lang, d.label), value: d.valueText ?? '' })
}
