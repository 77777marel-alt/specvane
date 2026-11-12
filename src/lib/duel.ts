import type { Locale } from './i18n/config'
import type { SpecGroup } from './types'
import type { SpecPosition } from './catalog'
import type { DuelGroup, DuelText } from '@/components/views/Duel'
import en from '../../data/duel/en.json'
import de from '../../data/duel/de.json'
import fr from '../../data/duel/fr.json'
import it from '../../data/duel/it.json'
import es from '../../data/duel/es.json'
import nl from '../../data/duel/nl.json'
import pl from '../../data/duel/pl.json'
import sv from '../../data/duel/sv.json'
import ptbr from '../../data/duel/pt-br.json'
import ja from '../../data/duel/ja.json'
import tr from '../../data/duel/tr.json'
import el from '../../data/duel/el.json'
import cs from '../../data/duel/cs.json'
import ro from '../../data/duel/ro.json'
import da from '../../data/duel/da.json'
import fi from '../../data/duel/fi.json'
import nb from '../../data/duel/nb.json'
import ru from '../../data/duel/ru.json'
import uk from '../../data/duel/uk.json'
import ar from '../../data/duel/ar.json'

const T = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, DuelText>
export const duelText = (l: Locale): DuelText => T[l] ?? en

/** Группы характеристик для «Дуэли»: средняя позиция в каталоге (0–100) у каждой из двух моделей; до 5 групп. */
export function duelGroups(specGroups: SpecGroup[], pos: [SpecPosition[], SpecPosition[]]): DuelGroup[] {
  const out: (DuelGroup & { order: number })[] = []
  specGroups.forEach((g, order) => {
    const keys = g.specs.map((s) => s.key)
    const both = keys.map((k) => [pos[0].find((x) => x.key === k), pos[1].find((x) => x.key === k)] as const).filter(([a, b]) => a && b)
    if (!both.length) return
    const avg = (i: 0 | 1) => Math.round(both.reduce((s, p) => s + p[i]!.better, 0) / both.length)
    out.push({ name: g.name, a: avg(0), b: avg(1), specs: both.map(([a]) => a!.label), order })
  })
  return out.sort((x, y) => y.specs.length - x.specs.length).slice(0, 5).sort((x, y) => x.order - y.order).map((g) => ({ name: g.name, a: g.a, b: g.b, specs: g.specs }))
}
