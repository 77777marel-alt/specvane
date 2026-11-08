import 'server-only'
import type { Locale } from './config'
import type { Dict } from './dict/en'
import { en } from './dict/en'
import { de } from './dict/de'
import { fr } from './dict/fr'
import { it } from './dict/it'
import { es } from './dict/es'
import { nl } from './dict/nl'
import { pl } from './dict/pl'
import { sv } from './dict/sv'
import { ptBr } from './dict/pt-br'
import { ja } from './dict/ja'

const DICTS: Record<Locale, Dict> = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptBr, ja }
export const getDict = (l: Locale): Dict => DICTS[l]
export type { Dict }
