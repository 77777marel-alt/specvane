import type { Locale } from './i18n/config'
import en from '../../data/tools/en.json'
import de from '../../data/tools/de.json'
import fr from '../../data/tools/fr.json'
import it from '../../data/tools/it.json'
import es from '../../data/tools/es.json'
import nl from '../../data/tools/nl.json'
import pl from '../../data/tools/pl.json'
import sv from '../../data/tools/sv.json'
import ptbr from '../../data/tools/pt-br.json'
import ja from '../../data/tools/ja.json'
import tr from '../../data/tools/tr.json'
import el from '../../data/tools/el.json'
import cs from '../../data/tools/cs.json'
import ro from '../../data/tools/ro.json'
import da from '../../data/tools/da.json'
import fi from '../../data/tools/fi.json'
import nb from '../../data/tools/nb.json'
import ru from '../../data/tools/ru.json'
import uk from '../../data/tools/uk.json'
import ar from '../../data/tools/ar.json'

// Тексты калькуляторов (data/tools/<язык>.json). Ключи инструментов в адресе — английские: tv-size, projector-distance, screen-ppi, power-bank-flight.
export type ToolsText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, ToolsText>
export const toolsText = (l: Locale): ToolsText => T[l] ?? en
export const TOOLS = [
  { id: 'tv-size', key: 'tv', cat: 'tvs' },
  { id: 'projector-distance', key: 'projector', cat: 'projectors' },
  { id: 'screen-ppi', key: 'ppi', cat: 'monitors' },
  { id: 'power-bank-flight', key: 'powerbank', cat: 'power-banks' },
  { id: 'air-conditioner-size', key: 'ac', cat: 'air-conditioners' },
  { id: 'boiler-size', key: 'boiler', cat: 'boilers' },
  { id: 'household-appliance-size', key: 'household', cat: 'fridges' },
  { id: 'electricity-cost', key: 'energy', cat: 'washing-machines' },
] as const
export type ToolKey = (typeof TOOLS)[number]['key']
