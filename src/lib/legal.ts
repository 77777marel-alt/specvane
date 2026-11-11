import type { Locale } from './i18n/config'
import en from '../../data/legal/en.json'
import de from '../../data/legal/de.json'
import fr from '../../data/legal/fr.json'
import it from '../../data/legal/it.json'
import es from '../../data/legal/es.json'
import nl from '../../data/legal/nl.json'
import pl from '../../data/legal/pl.json'
import sv from '../../data/legal/sv.json'
import ptbr from '../../data/legal/pt-br.json'
import ja from '../../data/legal/ja.json'
import tr from '../../data/legal/tr.json'
import el from '../../data/legal/el.json'
import cs from '../../data/legal/cs.json'
import ro from '../../data/legal/ro.json'
import da from '../../data/legal/da.json'
import fi from '../../data/legal/fi.json'
import nb from '../../data/legal/nb.json'
import ru from '../../data/legal/ru.json'
import uk from '../../data/legal/uk.json'
import ar from '../../data/legal/ar.json'

// Юридические оговорки (data/legal/<язык>.json): подвал, рейтинги, коды ошибок, страница «Правовая информация».
export type LegalText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, LegalText>
export const legalText = (l: Locale): LegalText => T[l] ?? en
