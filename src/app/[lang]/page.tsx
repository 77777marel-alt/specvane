import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { getCategories } from '@/lib/data'
import { alternates } from '@/lib/seo'
import { SearchBox } from '@/components/SearchBox'
import { IconAppliance, IconCamera, IconCpu, IconGamepad, IconGpu, IconHeadphones, IconLaptop, IconMonitor, IconPhone, IconProjector, IconSpeaker, IconTablet, IconTv, IconWatch } from '@/components/icons'

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

// Плитки категорий в порядке спроса в поиске (исследование 08.11.2026, docs: claude/categories-priority.md).
// Ссылкой становятся, когда категория включена в базе.
const TILES = [
  ['phones', IconPhone], ['laptops', IconLaptop], ['headphones', IconHeadphones], ['tvs', IconTv],
  ['tablets', IconTablet], ['cpus', IconCpu], ['gpus', IconGpu], ['watches', IconWatch],
  ['monitors', IconMonitor], ['consoles', IconGamepad], ['speakers', IconSpeaker], ['cameras', IconCamera],
  ['projectors', IconProjector], ['appliances', IconAppliance],
] as const
const APPLIANCES = ['washing-machines', 'tumble-dryers', 'fridges', 'coffee-machines']
const DB_KEY: Record<string, string> = { phones: 'smartphones', watches: 'smartwatches', cpus: 'processors', gpus: 'graphics-cards', consoles: 'game-consoles', appliances: 'home-appliances' }

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const t = getDict(lang)
  const live = await getCategories(lang)
  const liveByKey = new Map(live.map((c) => [c.key, c]))
  // бытовая техника: вместо одной плитки «скоро» — живые подкатегории (стиральные машины, холодильники…)
  const appliances = APPLIANCES.filter((k) => liveByKey.has(k)).map((k) => [k, IconAppliance] as const)
  const tiles = TILES.flatMap((tile) => (tile[0] === 'appliances' && appliances.length ? appliances : [tile]))
  return (
    <>
      <section className="relative py-10 md:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 -z-10 h-full w-screen -translate-x-1/2 bg-[radial-gradient(50%_70%_at_25%_0%,var(--accent-soft),transparent)]" />
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl md:leading-[1.05]">{t.home.h1}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{t.home.lead}</p>
        <div className="mt-8 hidden max-w-2xl md:block">
          <SearchBox lang={lang} variant="hero" placeholder={t.ui.searchPlaceholder} label={t.ui.searchLabel} empty={t.ui.noResults} />
        </div>
      </section>

      <section id="categories" aria-labelledby="cats" className="py-4">
        <h2 id="cats" className="mb-4 text-xl font-semibold">{t.home.categoriesTitle}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {tiles.map(([key, Icon]) => {
            const c = liveByKey.get(DB_KEY[key] ?? key)
            const inner = (
              <>
                <Icon className="h-7 w-7 text-accent" />
                <span className="mt-3 font-medium">{c?.name ?? t.cats[key as keyof typeof t.cats]}</span>
                {!c && <span className="mt-0.5 text-xs text-muted">{t.cats.soon}</span>}
              </>
            )
            return (
              <li key={key}>
                {c ? (
                  <Link href={`/${lang}/${c.slug}`} className="flex h-full flex-col rounded-2xl border border-border p-4 transition-shadow hover:border-accent hover:shadow-card">{inner}</Link>
                ) : (
                  <div className="flex h-full flex-col rounded-2xl border border-dashed border-border p-4 opacity-80">{inner}</div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {(() => {
        // все остальные включённые категории (автоматические из Icecat и др.) — компактным списком
        const shown = new Set(tiles.map(([k]) => DB_KEY[k] ?? k))
        const rest = live.filter((c) => !shown.has(c.key)).sort((a, b) => a.name.localeCompare(b.name, lang))
        if (!rest.length) return null
        return (
          <section aria-labelledby="allcats" className="py-6">
            <h2 id="allcats" className="mb-3 text-lg font-semibold">{t.ui.categories}</h2>
            <ul className="columns-2 gap-x-6 text-sm sm:columns-3 lg:columns-4">
              {rest.map((c) => (
                <li key={c.key} className="break-inside-avoid py-1"><Link href={`/${lang}/${c.slug}`} className="hover:text-accent hover:underline">{c.name}</Link></li>
              ))}
            </ul>
          </section>
        )
      })()}

      <section className="grid gap-4 py-12 md:grid-cols-3">
        {[t.home.how1, t.home.how2, t.home.how3].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border p-5">
            <div className="num flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent">{i + 1}</div>
            <p className="mt-3 text-muted">{s}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl bg-surface p-6 md:p-8">
        <h2 className="text-xl font-semibold">{t.home.honestTitle}</h2>
        <p className="mt-2 max-w-3xl text-muted">{t.home.honest}</p>
      </section>
    </>
  )
}
