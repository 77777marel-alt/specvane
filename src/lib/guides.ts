import type { Locale } from './i18n/config'
import en from '../../data/guides/en.json'
import de from '../../data/guides/de.json'
import fr from '../../data/guides/fr.json'
import it from '../../data/guides/it.json'
import es from '../../data/guides/es.json'
import nl from '../../data/guides/nl.json'
import pl from '../../data/guides/pl.json'
import sv from '../../data/guides/sv.json'
import ptbr from '../../data/guides/pt-br.json'
import ja from '../../data/guides/ja.json'
import tr from '../../data/guides/tr.json'
import el from '../../data/guides/el.json'
import cs from '../../data/guides/cs.json'
import ro from '../../data/guides/ro.json'
import da from '../../data/guides/da.json'
import fi from '../../data/guides/fi.json'
import nb from '../../data/guides/nb.json'
import ru from '../../data/guides/ru.json'
import uk from '../../data/guides/uk.json'
import ar from '../../data/guides/ar.json'

// Гиды «Как выбрать» (data/guides/<язык>.json): адрес — /<язык>/<guides>/<адрес категории>.
export type Guide = { cat: string; title: string; lead: string; sections: { h: string; p: string[] }[]; checklist: string[]; mistakes: string[]; specs: string[]; glossary: string[]; faq: { q: string; a: string }[] }
const G = { en, de, fr, it, es, nl, pl, sv, 'pt-br': ptbr, ja, tr, el, cs, ro, da, fi, nb, ru, uk, ar } as Record<Locale, Guide[]>
export const guides = (l: Locale): Guide[] => G[l] ?? (en as Guide[])
export const guideFor = (l: Locale, cat: string): Guide | undefined => guides(l).find((g) => g.cat === cat)
export const GUIDE_CATS = (en as Guide[]).map((g) => g.cat)
type Ui = { title: string; lead: string; checklist: string; mistakes: string; faq: string; terms: string; best: string; all: string; one: string }
export const GUIDE_UI: Record<Locale, Ui> = {
  en: { title: 'Buying guides', lead: 'How to choose a phone, laptop, TV or appliance: what matters, what is marketing, and which numbers to look for.', checklist: 'Quick checklist', mistakes: 'Common mistakes', faq: 'Frequently asked questions', terms: 'Terms explained', best: 'Top models by key specs', all: 'See all models', one: 'Buying guide' },
  de: { title: 'Kaufberatung', lead: 'So wählen Sie Smartphone, Laptop, Fernseher oder Haushaltsgerät: was zählt, was Marketing ist und auf welche Werte Sie achten sollten.', checklist: 'Checkliste', mistakes: 'Häufige Fehler', faq: 'Häufige Fragen', terms: 'Begriffe erklärt', best: 'Top-Modelle nach wichtigen Werten', all: 'Alle Modelle ansehen', one: 'Kaufberatung' },
  fr: { title: 'Guides d’achat', lead: 'Comment choisir un smartphone, un PC portable, un téléviseur ou un appareil ménager : ce qui compte, ce qui relève du marketing et les chiffres à regarder.', checklist: 'Check-list', mistakes: 'Erreurs fréquentes', faq: 'Questions fréquentes', terms: 'Termes expliqués', best: 'Meilleurs modèles par critère', all: 'Voir tous les modèles', one: 'Guide d’achat' },
  it: { title: 'Guide all’acquisto', lead: 'Come scegliere smartphone, notebook, TV o elettrodomestico: cosa conta, cosa è marketing e quali numeri guardare.', checklist: 'Checklist', mistakes: 'Errori comuni', faq: 'Domande frequenti', terms: 'Termini spiegati', best: 'Migliori modelli per caratteristica', all: 'Vedi tutti i modelli', one: 'Guida all’acquisto' },
  es: { title: 'Guías de compra', lead: 'Cómo elegir móvil, portátil, televisor o electrodoméstico: qué importa, qué es marketing y qué cifras mirar.', checklist: 'Lista rápida', mistakes: 'Errores frecuentes', faq: 'Preguntas frecuentes', terms: 'Términos explicados', best: 'Mejores modelos por característica', all: 'Ver todos los modelos', one: 'Guía de compra' },
  nl: { title: 'Koopgidsen', lead: 'Zo kiest u een smartphone, laptop, tv of huishoudapparaat: wat telt, wat marketing is en op welke cijfers u let.', checklist: 'Checklist', mistakes: 'Veelgemaakte fouten', faq: 'Veelgestelde vragen', terms: 'Begrippen uitgelegd', best: 'Topmodellen per specificatie', all: 'Alle modellen bekijken', one: 'Koopgids' },
  pl: { title: 'Poradniki zakupowe', lead: 'Jak wybrać smartfon, laptop, telewizor lub AGD: co się liczy, co jest marketingiem i na jakie liczby patrzeć.', checklist: 'Szybka lista kontrolna', mistakes: 'Częste błędy', faq: 'Najczęstsze pytania', terms: 'Pojęcia w skrócie', best: 'Najlepsze modele według parametrów', all: 'Zobacz wszystkie modele', one: 'Poradnik zakupowy' },
  sv: { title: 'Köpguider', lead: 'Så väljer du mobil, laptop, tv eller vitvara: vad som spelar roll, vad som är marknadsföring och vilka siffror du ska titta på.', checklist: 'Checklista', mistakes: 'Vanliga misstag', faq: 'Vanliga frågor', terms: 'Begrepp förklarade', best: 'Toppmodeller efter viktiga specifikationer', all: 'Se alla modeller', one: 'Köpguide' },
  'pt-br': { title: 'Guias de compra', lead: 'Como escolher celular, notebook, TV ou eletrodoméstico: o que importa, o que é marketing e quais números observar.', checklist: 'Checklist rápido', mistakes: 'Erros comuns', faq: 'Perguntas frequentes', terms: 'Termos explicados', best: 'Melhores modelos por especificação', all: 'Ver todos os modelos', one: 'Guia de compra' },
  ja: { title: '購入ガイド', lead: 'スマホ、ノートPC、テレビ、家電の選び方。大事なポイント、宣伝文句の見抜き方、見るべき数値を解説します。', checklist: 'チェックリスト', mistakes: 'よくある失敗', faq: 'よくある質問', terms: '用語解説', best: '主要スペック別トップモデル', all: 'すべてのモデルを見る', one: '購入ガイド' },
  tr: { title: 'Satın alma rehberleri', lead: 'Telefon, dizüstü bilgisayar, televizyon veya beyaz eşya nasıl seçilir: neyin önemli olduğu, neyin pazarlama olduğu ve hangi değerlere bakmanız gerektiği.', checklist: 'Kontrol listesi', mistakes: 'Sık yapılan hatalar', faq: 'Sık sorulan sorular', terms: 'Terimler', best: 'Önemli özelliklere göre en iyi modeller', all: 'Tüm modelleri görün', one: 'Satın alma rehberi' },
  el: { title: 'Οδηγοί αγοράς', lead: 'Πώς να διαλέξετε κινητό, laptop, τηλεόραση ή οικιακή συσκευή: τι μετράει, τι είναι μάρκετινγκ και ποια νούμερα να κοιτάξετε.', checklist: 'Γρήγορη λίστα ελέγχου', mistakes: 'Συνηθισμένα λάθη', faq: 'Συχνές ερωτήσεις', terms: 'Όροι με απλά λόγια', best: 'Κορυφαία μοντέλα ανά χαρακτηριστικό', all: 'Δείτε όλα τα μοντέλα', one: 'Οδηγός αγοράς' },
  cs: { title: 'Nákupní rádce', lead: 'Jak vybrat telefon, notebook, televizi nebo spotřebič: co je důležité, co je marketing a na jaká čísla se dívat.', checklist: 'Rychlý kontrolní seznam', mistakes: 'Časté chyby', faq: 'Časté otázky', terms: 'Pojmy vysvětleny', best: 'Nejlepší modely podle parametrů', all: 'Zobrazit všechny modely', one: 'Nákupní rádce' },
  ro: { title: 'Ghiduri de cumpărare', lead: 'Cum alegeți telefonul, laptopul, televizorul sau electrocasnicul: ce contează, ce e marketing și la ce cifre să vă uitați.', checklist: 'Listă rapidă', mistakes: 'Greșeli frecvente', faq: 'Întrebări frecvente', terms: 'Termeni explicați', best: 'Cele mai bune modele după specificații', all: 'Vedeți toate modelele', one: 'Ghid de cumpărare' },
  da: { title: 'Købsguides', lead: 'Sådan vælger du mobil, bærbar, tv eller hvidevare: hvad der betyder noget, hvad der er markedsføring, og hvilke tal du skal kigge efter.', checklist: 'Tjekliste', mistakes: 'Typiske fejl', faq: 'Ofte stillede spørgsmål', terms: 'Begreber forklaret', best: 'Topmodeller efter vigtige specifikationer', all: 'Se alle modeller', one: 'Købsguide' },
  fi: { title: 'Ostooppaat', lead: 'Näin valitset puhelimen, kannettavan, television tai kodinkoneen: mikä on tärkeää, mikä markkinointia ja mihin lukuihin kannattaa katsoa.', checklist: 'Tarkistuslista', mistakes: 'Yleiset virheet', faq: 'Usein kysyttyä', terms: 'Termit selitettynä', best: 'Parhaat mallit tärkeimpien ominaisuuksien mukaan', all: 'Katso kaikki mallit', one: 'Ostoopas' },
  nb: { title: 'Kjøpeguider', lead: 'Slik velger du mobil, bærbar, TV eller hvitevare: hva som betyr noe, hva som er markedsføring, og hvilke tall du bør se på.', checklist: 'Sjekkliste', mistakes: 'Vanlige feil', faq: 'Ofte stilte spørsmål', terms: 'Begreper forklart', best: 'Toppmodeller etter viktige spesifikasjoner', all: 'Se alle modeller', one: 'Kjøpeguide' },
  ru: { title: 'Как выбрать', lead: 'Как выбрать смартфон, ноутбук, телевизор или бытовую технику: что действительно важно, что маркетинг и на какие цифры смотреть.', checklist: 'Короткий чек-лист', mistakes: 'Частые ошибки', faq: 'Частые вопросы', terms: 'Термины простыми словами', best: 'Лучшие модели по главным характеристикам', all: 'Все модели', one: 'Как выбрать' },
  uk: { title: 'Як обрати', lead: 'Як обрати смартфон, ноутбук, телевізор або побутову техніку: що справді важливо, що маркетинг і на які цифри дивитися.', checklist: 'Короткий чек-лист', mistakes: 'Поширені помилки', faq: 'Часті запитання', terms: 'Терміни простими словами', best: 'Найкращі моделі за головними характеристиками', all: 'Усі моделі', one: 'Як обрати' },
  ar: { title: 'أدلة الشراء', lead: 'كيف تختار الهاتف أو الحاسوب المحمول أو التلفاز أو الجهاز المنزلي: ما المهم، وما مجرد تسويق، وما الأرقام التي يجب النظر إليها.', checklist: 'قائمة تحقق سريعة', mistakes: 'أخطاء شائعة', faq: 'أسئلة شائعة', terms: 'مصطلحات مشروحة', best: 'أفضل الطرازات حسب المواصفات الأساسية', all: 'عرض كل الطرازات', one: 'دليل الشراء' },
} as Record<Locale, Ui>
