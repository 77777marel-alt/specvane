import type { Locale } from './i18n/config'
import en from '../../data/widgets/en.json'
import de from '../../data/widgets/de.json'
import fr from '../../data/widgets/fr.json'
import it from '../../data/widgets/it.json'
import es from '../../data/widgets/es.json'
import nl from '../../data/widgets/nl.json'
import pl from '../../data/widgets/pl.json'
import sv from '../../data/widgets/sv.json'
import ptbr from '../../data/widgets/pt-br.json'
import ja from '../../data/widgets/ja.json'
import tr from '../../data/widgets/tr.json'
import el from '../../data/widgets/el.json'
import cs from '../../data/widgets/cs.json'
import ro from '../../data/widgets/ro.json'
import da from '../../data/widgets/da.json'
import fi from '../../data/widgets/fi.json'
import nb from '../../data/widgets/nb.json'
import ru from '../../data/widgets/ru.json'
import uk from '../../data/widgets/uk.json'
import ar from '../../data/widgets/ar.json'

// Тексты виджетов для блогов и форумов (data/widgets/<язык>.json).
export type WidgetsText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, WidgetsText>
export const widgetsText = (l: Locale): WidgetsText => T[l] ?? en
