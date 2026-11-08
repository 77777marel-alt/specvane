import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { getCategories } from '@/lib/data'
import { alternates } from '@/lib/seo'

export async function generateMetadata({ params }: PageProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const t = getDict(lang)
  return {
    title: t.meta.homeTitle,
    description: t.meta.homeDescription,
    alternates: alternates(lang, (l) => `/${l}`),
    openGraph: { title: t.meta.homeTitle, description: t.meta.homeDescription, type: 'website' },
  }
}

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = getDict(lang)
  const categories = await getCategories(lang)
  return (
    <>
      <section className="py-12 md:py-20">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">{t.home.h1}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{t.home.lead}</p>
      </section>

      <section aria-labelledby="cats" className="py-6">
        <h2 id="cats" className="mb-4 text-xl font-semibold">{t.home.categoriesTitle}</h2>
        {categories.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-4 text-muted">{t.home.comingSoon}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.key}>
                <Link href={`/${lang}/${c.slug}`} className="block rounded-lg border border-border p-4 font-medium hover:border-accent">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 py-10 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-semibold">{t.home.howTitle}</h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted">
            <li>{t.home.how1}</li>
            <li>{t.home.how2}</li>
            <li>{t.home.how3}</li>
          </ol>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-2 text-xl font-semibold">{t.home.honestTitle}</h2>
          <p className="text-muted">{t.home.honest}</p>
        </div>
      </section>
    </>
  )
}
