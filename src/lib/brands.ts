import type { Locale } from './i18n/config'
import en from '../../data/brands/en.json'
import de from '../../data/brands/de.json'
import fr from '../../data/brands/fr.json'
import it from '../../data/brands/it.json'
import es from '../../data/brands/es.json'
import nl from '../../data/brands/nl.json'
import pl from '../../data/brands/pl.json'
import sv from '../../data/brands/sv.json'
import ptbr from '../../data/brands/pt-br.json'
import ja from '../../data/brands/ja.json'
import tr from '../../data/brands/tr.json'
import el from '../../data/brands/el.json'
import cs from '../../data/brands/cs.json'
import ro from '../../data/brands/ro.json'
import da from '../../data/brands/da.json'
import fi from '../../data/brands/fi.json'
import nb from '../../data/brands/nb.json'
import ru from '../../data/brands/ru.json'
import uk from '../../data/brands/uk.json'
import ar from '../../data/brands/ar.json'

// Тексты страниц «Бренд A или бренд B» (data/brands/<язык>.json).
export type BrandsText = typeof en
const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, BrandsText>
export const brandsText = (l: Locale): BrandsText => T[l] ?? en
