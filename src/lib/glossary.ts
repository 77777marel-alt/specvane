import type { Locale } from './i18n/config'
import en from '../../data/glossary/en.json'
import de from '../../data/glossary/de.json'
import fr from '../../data/glossary/fr.json'
import it from '../../data/glossary/it.json'
import es from '../../data/glossary/es.json'
import nl from '../../data/glossary/nl.json'
import pl from '../../data/glossary/pl.json'
import sv from '../../data/glossary/sv.json'
import ptbr from '../../data/glossary/pt-br.json'
import ja from '../../data/glossary/ja.json'
import tr from '../../data/glossary/tr.json'
import el from '../../data/glossary/el.json'
import cs from '../../data/glossary/cs.json'
import ro from '../../data/glossary/ro.json'
import da from '../../data/glossary/da.json'
import fi from '../../data/glossary/fi.json'
import nb from '../../data/glossary/nb.json'
import ru from '../../data/glossary/ru.json'
import uk from '../../data/glossary/uk.json'
import ar from '../../data/glossary/ar.json'

// Словарь терминов (data/glossary/<язык>.json): адрес термина — английский slug, общий для всех языков.
export type Term = { slug: string; term: string; short: string; body: string[]; good: string; specs: { cat: string; key?: string }[]; related: string[] }
const G = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, Term[]>
export const glossary = (l: Locale): Term[] => G[l] ?? (en as Term[])
export const glossaryTerm = (l: Locale, slug: string): Term | undefined => glossary(l).find((x) => x.slug === slug)
export const GLOSSARY_SLUGS = (en as Term[]).map((x) => x.slug)
export const GLOSSARY_UI: Record<Locale, { title: string; lead: string; good: string; best: string; related: string }> = {
  'en': { title: 'Tech glossary', lead: 'Plain-language explanations of the specs you see in product listings — what they mean and what value is good.', good: "What's good", best: 'Top models by this spec', related: 'Related terms' },
  'de': { title: 'Technik-Glossar', lead: 'Technische Daten einfach erklärt: was sie bedeuten und welcher Wert gut ist.', good: 'Was ist gut', best: 'Top-Modelle nach diesem Wert', related: 'Verwandte Begriffe' },
  'fr': { title: 'Glossaire tech', lead: "Les caractéristiques techniques expliquées simplement : ce qu'elles signifient et quelle valeur est bonne.", good: 'Ce qui est bien', best: 'Meilleurs modèles selon ce critère', related: 'Termes associés' },
  'it': { title: 'Glossario tecnologico', lead: 'Le specifiche tecniche spiegate in modo semplice: cosa significano e quale valore è buono.', good: 'Cosa è buono', best: 'Migliori modelli per questa caratteristica', related: 'Termini correlati' },
  'es': { title: 'Glosario tecnológico', lead: 'Las especificaciones explicadas de forma sencilla: qué significan y qué valor es bueno.', good: 'Qué es bueno', best: 'Mejores modelos por esta característica', related: 'Términos relacionados' },
  'nl': { title: 'Techwoordenlijst', lead: 'Specificaties eenvoudig uitgelegd: wat ze betekenen en welke waarde goed is.', good: 'Wat is goed', best: 'Topmodellen op deze specificatie', related: 'Verwante begrippen' },
  'pl': { title: 'Słownik technologii', lead: 'Parametry techniczne wyjaśnione prosto: co oznaczają i jaka wartość jest dobra.', good: 'Co jest dobre', best: 'Najlepsze modele według tego parametru', related: 'Powiązane pojęcia' },
  'sv': { title: 'Teknikordlista', lead: 'Specifikationer förklarade enkelt: vad de betyder och vilket värde som är bra.', good: 'Vad är bra', best: 'Toppmodeller efter denna specifikation', related: 'Relaterade begrepp' },
  'pt-br': { title: 'Glossário de tecnologia', lead: 'Especificações explicadas de forma simples: o que significam e qual valor é bom.', good: 'O que é bom', best: 'Melhores modelos por esta especificação', related: 'Termos relacionados' },
  'ja': { title: 'テック用語集', lead: '製品スペックをわかりやすく解説。意味と、どの数値なら良いかがわかります。', good: '目安', best: 'このスペックの上位モデル', related: '関連用語' },
  'tr': { title: 'Teknoloji sözlüğü', lead: 'Teknik özellikler sade bir dille: ne anlama geldikleri ve hangi değerin iyi olduğu.', good: 'İyi değer', best: 'Bu özelliğe göre en iyi modeller', related: 'İlgili terimler' },
  'el': { title: 'Γλωσσάρι τεχνολογίας', lead: 'Τα τεχνικά χαρακτηριστικά με απλά λόγια: τι σημαίνουν και ποια τιμή είναι καλή.', good: 'Τι είναι καλό', best: 'Κορυφαία μοντέλα σε αυτό το χαρακτηριστικό', related: 'Σχετικοί όροι' },
  'cs': { title: 'Technický slovník', lead: 'Technické parametry jednoduše: co znamenají a jaká hodnota je dobrá.', good: 'Co je dobré', best: 'Nejlepší modely podle tohoto parametru', related: 'Související pojmy' },
  'ro': { title: 'Glosar tehnic', lead: 'Specificațiile explicate simplu: ce înseamnă și ce valoare este bună.', good: 'Ce e bine', best: 'Cele mai bune modele după acest parametru', related: 'Termeni înrudiți' },
  'da': { title: 'Teknisk ordliste', lead: 'Specifikationer forklaret enkelt: hvad de betyder, og hvilken værdi der er god.', good: 'Hvad er godt', best: 'Topmodeller efter denne specifikation', related: 'Relaterede begreber' },
  'fi': { title: 'Tekniikkasanasto', lead: 'Tekniset tiedot selkeästi: mitä ne tarkoittavat ja mikä arvo on hyvä.', good: 'Mikä on hyvä', best: 'Parhaat mallit tämän ominaisuuden mukaan', related: 'Liittyvät termit' },
  'nb': { title: 'Teknisk ordliste', lead: 'Spesifikasjoner forklart enkelt: hva de betyr, og hvilken verdi som er god.', good: 'Hva er bra', best: 'Toppmodeller etter denne spesifikasjonen', related: 'Relaterte begreper' },
  'ru': { title: 'Словарь терминов', lead: 'Характеристики техники простыми словами: что они значат и какое значение считается хорошим.', good: 'Что считается хорошим', best: 'Лучшие модели по этой характеристике', related: 'Связанные термины' },
  'uk': { title: 'Словник термінів', lead: 'Характеристики техніки простими словами: що вони означають і яке значення вважається добрим.', good: 'Що вважається добрим', best: 'Найкращі моделі за цією характеристикою', related: 'Пов’язані терміни' },
  'ar': { title: 'مسرد المصطلحات التقنية', lead: 'شرح مبسّط للمواصفات التقنية: ماذا تعني وما القيمة الجيدة.', good: 'ما القيمة الجيدة', best: 'أفضل الطرازات حسب هذه المواصفة', related: 'مصطلحات ذات صلة' },
} as Record<Locale, { title: string; lead: string; good: string; best: string; related: string }>
