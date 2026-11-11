import type { Locale } from './i18n/config'
import en from '../../data/usecases/en.json'
import de from '../../data/usecases/de.json'
import fr from '../../data/usecases/fr.json'
import it from '../../data/usecases/it.json'
import es from '../../data/usecases/es.json'
import nl from '../../data/usecases/nl.json'
import pl from '../../data/usecases/pl.json'
import sv from '../../data/usecases/sv.json'
import ptbr from '../../data/usecases/pt-br.json'
import ja from '../../data/usecases/ja.json'
import tr from '../../data/usecases/tr.json'
import el from '../../data/usecases/el.json'
import cs from '../../data/usecases/cs.json'
import ro from '../../data/usecases/ro.json'
import da from '../../data/usecases/da.json'
import fi from '../../data/usecases/fi.json'
import nb from '../../data/usecases/nb.json'
import ru from '../../data/usecases/ru.json'
import uk from '../../data/usecases/uk.json'
import ar from '../../data/usecases/ar.json'

// Тексты подборок «для кого» (data/usecases/<язык>.json); правила — data/usecases/defs.json.
export type UseCasesText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, UseCasesText>
export const useCasesText = (l: Locale): UseCasesText => T[l] ?? en
export const ucItem = (l: Locale, slug: string) => (useCasesText(l).items as Record<string, { title: string; lead: string }>)[slug] ?? (en.items as Record<string, { title: string; lead: string }>)[slug]
