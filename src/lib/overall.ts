import type { Locale } from './i18n/config'
import en from '../../data/overall/en.json'
import de from '../../data/overall/de.json'
import fr from '../../data/overall/fr.json'
import it from '../../data/overall/it.json'
import es from '../../data/overall/es.json'
import nl from '../../data/overall/nl.json'
import pl from '../../data/overall/pl.json'
import sv from '../../data/overall/sv.json'
import ptbr from '../../data/overall/pt-br.json'
import ja from '../../data/overall/ja.json'
import tr from '../../data/overall/tr.json'
import el from '../../data/overall/el.json'
import cs from '../../data/overall/cs.json'
import ro from '../../data/overall/ro.json'
import da from '../../data/overall/da.json'
import fi from '../../data/overall/fi.json'
import nb from '../../data/overall/nb.json'
import ru from '../../data/overall/ru.json'
import uk from '../../data/overall/uk.json'
import ar from '../../data/overall/ar.json'

// Тексты рейтинга «Лучшие в 2026» по общей оценке (data/overall/<язык>.json).
export type OverallText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, OverallText>
export const overallText = (l: Locale): OverallText => T[l] ?? en
