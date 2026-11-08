// Единый разборщик адресов языка: /de/impressum, /de/vergleich/…, /de/beamer, /de/beamer/epson-…
// Разделы с адресами на языке страны берутся из lib/routes.ts. Этап 0: инфо-страницы и категории.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { INFO_PAGES, resolveSlug, sectionHref, type InfoPage } from '@/lib/routes'
import { getCategoryBySlug } from '@/lib/data'
import { alternates } from '@/lib/seo'
import { previewProducts, previewChooseIf, CHIPS, tx } from '@/lib/preview'
import { ProductView } from '@/components/views/ProductView'
import { CompareView } from '@/components/views/CompareView'
import { CategoryView } from '@/components/views/CategoryView'

const PREVIEW = 'design-preview'

const isInfo = (k: string | null): k is InfoPage => !!k && (INFO_PAGES as readonly string[]).includes(k)

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const lang = isLocale(params.lang) ? params.lang : 'en'
  return INFO_PAGES.map((p) => ({ slug: sectionHref(lang, p).split('/').slice(2) }))
}

export async function generateMetadata({ params }: PageProps<'/[lang]/[...slug]'>): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLocale(lang)) return {}
  if (slug[0] === PREVIEW) return { title: `${getDict(lang).ui.previewTitle} · Specvane`, robots: { index: false, follow: false } }
  const key = slug.length === 1 ? resolveSlug(lang, slug[0]) : null
  if (isInfo(key)) {
    const t = getDict(lang)
    const robots = key === 'privacy' || key === 'cookies' || key === 'legal-notice' ? { index: false, follow: true } : undefined
    return { title: `${t.info[key].title} · Specvane`, alternates: alternates(lang, (l: Locale) => sectionHref(l, key)), robots }
  }
  if (slug.length === 1 && !key) {
    const cat = await getCategoryBySlug(lang, slug[0])
    if (cat) return { title: `${cat.name} · Specvane`, robots: { index: false, follow: true } } // включим индексацию на этапе 1
  }
  return {}
}

export default async function Dispatch({ params }: PageProps<'/[lang]/[...slug]'>) {
  const { lang, slug } = await params
  if (!isLocale(lang)) notFound()
  const t = getDict(lang)
  if (slug[0] === PREVIEW && slug.length <= 2) return <Preview lang={lang} view={slug[1] ?? 'product'} />
  const key = resolveSlug(lang, slug[0])

  if (slug.length === 1 && isInfo(key)) {
    const page = t.info[key]
    return (
      <article className="prose max-w-2xl py-12">
        <h1 className="mb-6 text-3xl font-bold">{page.title}</h1>
        {page.body.map((p, i) => (
          <p key={i} className="mb-4 leading-relaxed text-muted">{p}</p>
        ))}
      </article>
    )
  }

  if (slug.length === 1 && !key) {
    const cat = await getCategoryBySlug(lang, slug[0])
    if (cat) {
      return (
        <section className="py-12">
          <h1 className="text-3xl font-bold">{cat.name}</h1>
          <p className="mt-4 text-muted">{t.home.comingSoon}</p>
        </section>
      )
    }
  }

  // Разделы compare/best/brands/new/alternatives/guides и страницы товаров — этап 1.
  notFound()
}


/** Предпросмотр дизайна на вымышленных моделях (noindex, не в sitemap, закрыт в robots.txt). */
function Preview({ lang, view }: { lang: Locale; view: string }) {
  const t = getDict(lang)
  const base = `/${lang}/${PREVIEW}`
  const items = previewProducts(lang, t.ui.yes, t.ui.no, base)
  const home = { name: t.ui.home, href: `/${lang}` }
  const cat = { name: items[0].category.name, href: `${base}/category` }
  const tabs = [['product', items[0].name], ['compare', `${items[0].name} ${t.ui.vs} ${items[1].name}`], ['category', cat.name]]
  let body: React.ReactNode
  if (view === 'compare') {
    body = <CompareView lang={lang} t={t} items={items.slice(0, 2)} chooseIf={previewChooseIf(lang)}
      crumbs={[home, cat, { name: `${items[0].name} ${t.ui.vs} ${items[1].name}`, href: `${base}/compare` }]} />
  } else if (view === 'category') {
    body = <CategoryView lang={lang} t={t} title={cat.name} items={[...items, ...items].map((p, i) => ({ ...p, slug: p.slug + i, href: i % 3 === 1 ? `${base}/compare` : base }))}
      chips={tx(lang, CHIPS)} crumbs={[home, cat]} />
  } else if (view === 'product') {
    body = <ProductView lang={lang} t={t} p={items[0]} crumbs={[home, cat, { name: items[0].name, href: base }]}
      compareLinks={[{ name: `${items[0].name} ${t.ui.vs} ${items[1].name}`, href: `${base}/compare` }, { name: `${items[0].name} ${t.ui.vs} ${items[2].name}`, href: `${base}/compare` }]} />
  } else notFound()
  return (
    <>
      <div className="mt-4 rounded-xl border border-warn/40 bg-warn/10 px-4 py-2.5 text-sm">
        <strong>{t.ui.previewTitle}.</strong> {t.ui.previewNote}
        <nav className="mt-2 flex flex-wrap gap-2">
          {tabs.map(([k, label]) => (
            <a key={k} href={k === 'product' ? base : `${base}/${k}`} aria-current={view === k ? 'page' : undefined}
              className="rounded-full border border-border bg-bg px-3 py-1 aria-[current]:border-accent aria-[current]:text-accent">{label}</a>
          ))}
        </nav>
      </div>
      {body}
    </>
  )
}
