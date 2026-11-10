import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { getCategories } from '@/lib/data'
import { getHomeShowcase } from '@/lib/catalog'
import { ProductCard } from '@/components/product/ProductCard'
import { TOOLS, toolsText } from '@/lib/tools'
import { glossary, GLOSSARY_UI } from '@/lib/glossary'
const HOME_TERMS = ['refresh-rate', 'oled', 'hdr', 'ppi', 'mah', 'fast-charging', 'esim', 'ip68-ip-rating', 'ram', 'anc-noise-cancelling', 'megapixels', 'eu-energy-label']
import { sectionHref } from '@/lib/routes'
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
  const [live, showcase] = await Promise.all([getCategories(lang), getHomeShowcase(lang)])
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

      {showcase.some((c) => c.compares.length) && (
        <section aria-labelledby="popcmp" className="py-8">
          <h2 id="popcmp" className="mb-4 text-xl font-semibold">{t.ui.popularCompare}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {showcase.filter((c) => c.compares.length).map((c) => (
              <div key={c.key} className="rounded-2xl border border-border p-4">
                <h3 className="mb-2 text-sm font-semibold text-muted">{c.name}</h3>
                <ul className="space-y-1.5 text-sm">
                  {c.compares.map((x) => (
                    <li key={x.href}><Link href={x.href} className="line-clamp-2 font-medium hover:text-accent hover:underline">{x.name}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {showcase.filter((c) => c.fresh.length >= 2).map((c) => (
        <section key={c.key} aria-labelledby={`new-${c.key}`} className="py-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id={`new-${c.key}`} className="text-xl font-semibold">{c.name} · {t.nav.new}</h2>
            <Link href={c.href} className="shrink-0 text-sm font-medium text-accent hover:underline">{t.ui.seeAll} →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {c.fresh.map((p) => <ProductCard key={p.slug} lang={lang} p={p} />)}
          </div>
        </section>
      ))}

      {showcase.some((c) => c.best.length) && (
        <section aria-labelledby="tops" className="py-8">
          <h2 id="tops" className="mb-4 text-xl font-semibold">{t.ui.bestIndexTitle}</h2>
          <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {showcase.flatMap((c) => c.best).map((x) => (
              <li key={x.href}><Link href={x.href} className="flex min-h-11 items-center rounded-xl border border-border px-3 py-2 hover:border-accent hover:text-accent">{x.name}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="tools" className="py-6">
        <h2 id="tools" className="mb-3 text-xl font-semibold"><Link href={sectionHref(lang, 'tools')} className="hover:text-accent">{toolsText(lang).indexTitle}</Link></h2>
        <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((x) => (
            <li key={x.id}><Link href={sectionHref(lang, 'tools', x.id)} className="flex min-h-11 items-center rounded-xl border border-border px-3 py-2 hover:border-accent hover:text-accent">{toolsText(lang)[x.key].short}</Link></li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="glossary" className="py-6">
        <h2 id="glossary" className="mb-3 text-xl font-semibold"><Link href={sectionHref(lang, 'glossary')} className="hover:text-accent">{GLOSSARY_UI[lang].title}</Link></h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {glossary(lang).filter((x) => HOME_TERMS.includes(x.slug)).map((x) => (
            <li key={x.slug}><Link href={sectionHref(lang, 'glossary', x.slug)} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 hover:border-accent hover:text-accent">{x.term}</Link></li>
          ))}
          <li><Link href={sectionHref(lang, 'glossary')} className="inline-flex min-h-11 items-center px-3 font-medium text-accent hover:underline">→</Link></li>
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
