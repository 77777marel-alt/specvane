// Единый разборщик адресов языка: /de/impressum, /de/vergleich/…, /de/beamer, /de/beamer/epson-…
// Разделы с адресами на языке страны берутся из lib/routes.ts. Этап 0: инфо-страницы и категории.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { INFO_PAGES, resolveSlug, sectionHref, type InfoPage } from '@/lib/routes'
import { getCategoryBySlug } from '@/lib/data'
import { alternates } from '@/lib/seo'

const isInfo = (k: string | null): k is InfoPage => !!k && (INFO_PAGES as readonly string[]).includes(k)

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const lang = isLocale(params.lang) ? params.lang : 'en'
  return INFO_PAGES.map((p) => ({ slug: sectionHref(lang, p).split('/').slice(2) }))
}

export async function generateMetadata({ params }: PageProps<'/[lang]/[...slug]'>): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLocale(lang)) return {}
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

