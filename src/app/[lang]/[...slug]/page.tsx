// Единый разборщик адресов языка: /de/impressum, /de/vergleich/…, /de/beamer, /de/beamer/epson-…
// Разделы с адресами на языке страны берутся из lib/routes.ts. Этап 0: инфо-страницы и категории.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { INFO_PAGES, MANUAL_SLUG, resolveSlug, sectionHref, type InfoPage } from '@/lib/routes'
import { getCategory, getCategoryProducts, getProduct, getComparison, getCompareLinks, getTopComparisons, getFilterDefs, getPositions, getPrevGeneration, getBest, getBestSpecs, getBetterAlternatives, getCrossLinks, getTrends, getCategoryByKey, getGlossaryLinks } from '@/lib/catalog'
import { permanentRedirect } from 'next/navigation'
import { number, fill } from '@/lib/format'
import { alternates } from '@/lib/seo'
import { previewProducts, previewChooseIf, CHIPS, tx } from '@/lib/preview'
import { ProductView } from '@/components/views/ProductView'
import { CompareView } from '@/components/views/CompareView'
import { CategoryView } from '@/components/views/CategoryView'
import { BestView } from '@/components/views/BestView'
import { getCategories } from '@/lib/data'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { costInput } from '@/lib/costs'
import { ComparePicker } from '@/components/compare/ComparePicker'
import { APPLIANCES, errorBrands, errorCode, errorCodes, hasErrors, ERROR_LANGS, slugify, isAppliance, applianceName, type Appliance } from '@/lib/errors'
import { ErrorsBrand, ErrorsCode, ErrorsIndex } from '@/components/views/ErrorsView'
import { DocsList } from '@/components/product/DocsList'
import { supportFor } from '@/lib/updates'
import { TOOLS, toolsText } from '@/lib/tools'
import { ToolCalc } from '@/components/views/ToolCalc'
import { glossary, glossaryTerm, GLOSSARY_UI } from '@/lib/glossary'
import { ProductImage } from '@/components/product/ProductImage'
import { CompareTray } from '@/components/compare/CompareTray'

const PREVIEW = 'design-preview'


// ---------- коды ошибок: /<lang>/<error-codes>/<категория>/<бренд>/<код> ----------
async function applianceOf(lang: Locale, seg: string): Promise<{ key: Appliance; name: string; slug: string; href: string | null } | null> {
  for (const key of Object.keys(APPLIANCES) as Appliance[]) {
    const cat = await getCategoryByKey(lang, key)
    const n = applianceName(lang, key)
    const slug = cat?.slug ?? n.slug
    if (slug === seg) return { key, name: cat?.name ?? n.many, slug, href: cat ? `/${lang}/${cat.slug}` : null }
  }
  return null
}
const singular = (_t: ReturnType<typeof getDict>, a: Appliance, lang: Locale) => applianceName(lang, a).one
async function errorsMeta(lang: Locale, slug: string[]): Promise<Metadata> {
  const t = getDict(lang)
  if (!hasErrors(lang)) return {}
  const alt = (...rest: string[]) => alternates(lang, (l) => (ERROR_LANGS.includes(l) ? sectionHref(l, 'errors', ...rest) : null))
  if (slug.length === 1) return { title: `${t.ui.errTitle} · Specvane`, description: t.ui.errLead, alternates: alt() }
  const ap = await applianceOf(lang, slug[1])
  if (!ap) return {}
  // адрес раздела техники свой в каждом языке — для hreflang берём сегмент нужного языка
  const segs = Object.fromEntries(await Promise.all(ERROR_LANGS.map(async (l) => [l, (await getCategoryByKey(l, ap.key))?.slug ?? applianceName(l, ap.key).slug] as const)))
  const altAp = (...rest: string[]) => alternates(lang, (l) => (ERROR_LANGS.includes(l) ? sectionHref(l, 'errors', segs[l], ...rest) : null))
  if (slug.length === 3) {
    const codes = errorCodes(lang, ap.key, slug[2])
    if (!codes.length) return {}
    const title = fill(t.ui.errBrandTitle, { brand: codes[0].brand, appliance: singular(t, ap.key, lang) })
    return { title: `${title} · Specvane`, description: codes.slice(0, 8).map((c) => `${c.code}: ${c.title}`).join('; ').slice(0, 300), alternates: altAp(slug[2]) }
  }
  if (slug.length === 4) {
    const r = errorCode(lang, ap.key, slug[2], slug[3])
    if (!r) return {}
    const title = fill(t.ui.errCodeTitle, { brand: r.item.brand, appliance: singular(t, ap.key, lang), code: r.item.code })
    return { title: `${title}: ${r.item.title} · Specvane`, description: `${r.item.title}. ${r.item.causes[0] ?? ''} ${r.item.steps[0] ?? ''}`.slice(0, 300),
      alternates: altAp(slug[2], r.item.slug) }
  }
  return {}
}

const isInfo = (k: string | null): k is InfoPage => !!k && (INFO_PAGES as readonly string[]).includes(k)

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const lang = isLocale(params.lang) ? params.lang : 'en'
  return INFO_PAGES.map((p) => ({ slug: sectionHref(lang, p).split('/').slice(2) }))
}

export async function generateMetadata({ params }: PageProps<'/[lang]/[...slug]'>): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLocale(lang)) return {}
  if (slug[0] === PREVIEW) return { title: `${getDict(lang).ui.previewTitle} · Specvane`, robots: { index: false, follow: false } }
  const key = resolveSlug(lang, slug[0])
  if (slug.length === 1 && isInfo(key)) {
    const t = getDict(lang)
    const robots = key === 'privacy' || key === 'cookies' || key === 'legal-notice' ? { index: false, follow: true } : undefined
    return { title: `${t.info[key].title} · Specvane`, alternates: alternates(lang, (l: Locale) => sectionHref(l, key)), robots }
  }
  if (key === 'errors') return errorsMeta(lang, slug)
  if (key === 'glossary') {
    const g = GLOSSARY_UI[lang]
    if (slug.length === 1) return { title: `${g.title} · Specvane`, description: g.lead, alternates: alternates(lang, (l) => sectionHref(l, 'glossary')) }
    const term = slug.length === 2 ? glossaryTerm(lang, slug[1]) : undefined
    if (!term) return {}
    return { title: `${term.term} — ${g.title} · Specvane`, description: term.short, alternates: alternates(lang, (l) => sectionHref(l, 'glossary', term.slug)) }
  }
  if (key === 'tools') {
    const tt = toolsText(lang)
    if (slug.length === 1) return { title: `${tt.indexTitle} · Specvane`, description: tt.indexLead, alternates: alternates(lang, (l) => sectionHref(l, 'tools')) }
    const tool = slug.length === 2 ? TOOLS.find((x) => x.id === slug[1]) : null
    if (!tool) return {}
    return { title: `${tt[tool.key].title} · Specvane`, description: tt[tool.key].lead, alternates: alternates(lang, (l) => sectionHref(l, 'tools', tool.id)) }
  }
  if (key === 'best') {
    const t = getDict(lang)
    if (slug.length === 1) return { title: `${t.ui.bestIndexTitle} · Specvane`, alternates: alternates(lang, (l) => sectionHref(l, 'best')) }
    const cat = slug.length === 3 ? await getCategory(lang, slug[1]) : null
    const b = cat && await getBest(lang, cat, slug[2])
    if (!cat || !b) return {}
    const title = fill(t.ui.bestTitle, { category: cat.name, n: b.items.length, spec: b.label })
    return { title: `${title} · Specvane`, description: fill(t.ui.bestDesc, { n: b.items.length, spec: b.label, total: b.total }),
      alternates: alternates(lang, (l) => (cat.slugs[l] ? sectionHref(l, 'best', cat.slugs[l]!, slug[2]) : null)) }
  }
  if (key === 'compare') {
    const t = getDict(lang)
    if (slug.length === 1) return { title: `${t.nav.compare} · Specvane`, alternates: alternates(lang, (l) => sectionHref(l, 'compare')) }
    const c = await getComparison(lang, slug[1])
    if (!c) return {}
    const [a, b] = c.items
    const title = c.items.map((x) => `${x.brand} ${x.name}`).join(` ${t.ui.vs} `)
    const pair = c.canonical.split('/').pop()!
    return {
      title: `${title}: ${t.ui.allSpecs} · Specvane`,
      description: `${title} — ${a.keySpecs.slice(0, 3).map((k) => k.display).join(', ')} ${t.ui.vs} ${b.keySpecs.slice(0, 3).map((k) => k.display).join(', ')}.`,
      alternates: alternates(lang, (l) => `${sectionHref(l, 'compare')}/${pair}`),
      robots: c.known ? undefined : { index: false, follow: true },
      openGraph: { title, images: [{ url: `/og/${lang}/compare/${pair}.png`, width: 1200, height: 630 }] },
      twitter: { card: 'summary_large_image' },
    }
  }
  if (!key && slug.length === 3 && slug[2] === MANUAL_SLUG[lang]) {
    const cat = await getCategory(lang, slug[0])
    const p = cat && await getProduct(lang, cat, slug[1])
    if (!cat || !p || !p.docs.length) return {}
    const t = getDict(lang)
    const name = `${p.brand} ${p.name}`
    const title = fill(p.docs.some((d) => d.kind === 'manual') ? t.ui.manualPageTitle : t.ui.docsPageTitle, { name })
    return { title: `${title} · Specvane`, description: fill(t.ui.docsLead, { name }),
      alternates: alternates(lang, (l) => (cat.slugs[l] ? `/${l}/${cat.slugs[l]}/${p.slug}/${MANUAL_SLUG[l]}` : null)) }
  }
  if (!key && slug.length <= 2) {
    const cat = await getCategory(lang, slug[0])
    if (!cat) return {}
    const path = (l: Locale) => (cat.slugs[l] ? `/${l}/${[cat.slugs[l], ...slug.slice(1)].join('/')}` : null)
    const t = getDict(lang)
    if (slug.length === 1) {
      const items = await getCategoryProducts(lang, cat)
      return { title: `${cat.name}: ${t.ui.allSpecs} · Specvane`, description: `${cat.name} — ${items.length} ${t.ui.compare.toLowerCase()}`,
        alternates: alternates(lang, path) }
    }
    const p = await getProduct(lang, cat, slug[1])
    if (!p) return {}
    const ks = p.keySpecs.slice(0, 5).map((k) => `${k.label} ${k.display}`).join(', ')
    return {
      title: `${p.brand} ${p.name}: ${t.ui.allSpecs} · Specvane`,
      description: `${p.brand} ${p.name} — ${ks}.`,
      alternates: alternates(lang, path),
      openGraph: { title: `${p.brand} ${p.name}`, images: [{ url: `/og/${lang}/p/${cat.slug}/${p.slug}.png`, width: 1200, height: 630 }] },
      twitter: { card: 'summary_large_image' },
    }
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

  if (key === 'glossary' && slug.length <= 2) {
    const g = GLOSSARY_UI[lang]
    const home = { name: t.ui.home, href: `/${lang}` }
    const section = { name: g.title, href: sectionHref(lang, 'glossary') }
    const terms = glossary(lang)
    if (slug.length === 1) {
      const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term, lang))
      return (
        <>
          <Breadcrumbs items={[home, section]} />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{g.title}</h1>
          <p className="mt-2 max-w-2xl text-muted">{g.lead}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((x) => (
              <li key={x.slug}><a href={sectionHref(lang, 'glossary', x.slug)} className="block h-full rounded-2xl border border-border p-4 hover:border-accent">
                <span className="font-semibold">{x.term}</span><span className="mt-1 block text-sm text-muted line-clamp-2">{x.short}</span></a></li>
            ))}
          </ul>
        </>
      )
    }
    const term = glossaryTerm(lang, slug[1])
    if (!term) notFound()
    const links = await getGlossaryLinks(lang, term.specs)
    const rel = term.related.map((r) => terms.find((x) => x.slug === r)).filter((x) => !!x)
    const ld = { '@context': 'https://schema.org', '@type': 'DefinedTerm', name: term.term, description: term.short, inDefinedTermSet: { '@type': 'DefinedTermSet', name: g.title } }
    return (
      <article className="max-w-3xl">
        <Breadcrumbs items={[home, section, { name: term.term, href: sectionHref(lang, 'glossary', term.slug) }]} />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{term.term}</h1>
        <p className="mt-3 text-lg text-muted">{term.short}</p>
        <div className="mt-6 space-y-4 leading-relaxed">{term.body.map((p, i) => <p key={i}>{p}</p>)}</div>
        <section className="mt-6 rounded-2xl bg-good-soft p-4">
          <h2 className="mb-1 font-semibold text-good">{g.good}</h2>
          <p>{term.good}</p>
        </section>
        {links.length > 0 && (
          <nav className="mt-8" aria-label={g.best}>
            <h2 className="mb-3 font-semibold">{g.best}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {links.map((x) => <li key={x.href}><a href={x.href} className="flex min-h-11 items-center rounded-xl border border-border px-3 py-2 hover:border-accent hover:text-accent">{x.name} →</a></li>)}
            </ul>
          </nav>
        )}
        {rel.length > 0 && (
          <nav className="mt-8" aria-label={g.related}>
            <h2 className="mb-3 font-semibold">{g.related}</h2>
            <ul className="flex flex-wrap gap-2">
              {rel.map((x) => <li key={x!.slug}><a href={sectionHref(lang, 'glossary', x!.slug)} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 hover:border-accent hover:text-accent">{x!.term}</a></li>)}
            </ul>
          </nav>
        )}
        <p className="mt-8"><a href={sectionHref(lang, 'glossary')} className="font-medium text-accent hover:underline">← {g.title}</a></p>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </article>
    )
  }

  if (key === 'tools' && slug.length <= 2) {
    const tt = toolsText(lang)
    const home = { name: t.ui.home, href: `/${lang}` }
    const section = { name: tt.indexTitle, href: sectionHref(lang, 'tools') }
    if (slug.length === 1) {
      return (
        <>
          <Breadcrumbs items={[home, section]} />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tt.indexTitle}</h1>
          <p className="mt-2 max-w-2xl text-muted">{tt.indexLead}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {TOOLS.map((x) => (
              <li key={x.id}><a href={sectionHref(lang, 'tools', x.id)} className="block h-full rounded-2xl border border-border p-4 hover:border-accent">
                <span className="font-semibold">{tt[x.key].short}</span><span className="mt-1 block text-sm text-muted line-clamp-2">{tt[x.key].lead}</span></a></li>
            ))}
          </ul>
        </>
      )
    }
    const tool = TOOLS.find((x) => x.id === slug[1])
    if (!tool) notFound()
    const cat = await getCategoryByKey(lang, tool.cat)
    const tx = tt[tool.key]
    return (
      <>
        <Breadcrumbs items={[home, section, { name: tx.short, href: sectionHref(lang, 'tools', tool.id) }]} />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tx.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{tx.lead}</p>
        <section className="mt-6 max-w-3xl rounded-2xl border border-border p-4 md:p-6">
          <ToolCalc tool={tool.key} t={tt} lang={lang} imperialDefault={lang === 'en'} />
        </section>
        {cat && <p className="mt-4"><a href={`/${lang}/${cat.slug}`} className="font-medium text-accent hover:underline">{tx.cta}: {cat.name} →</a></p>}
        <nav className="mt-10" aria-label={tt.indexTitle}>
          <h2 className="mb-3 font-semibold">{tt.indexTitle}</h2>
          <ul className="flex flex-wrap gap-2">
            {TOOLS.filter((x) => x.id !== tool.id).map((x) => (
              <li key={x.id}><a href={sectionHref(lang, 'tools', x.id)} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 hover:border-accent hover:text-accent">{tt[x.key].short}</a></li>
            ))}
          </ul>
        </nav>
      </>
    )
  }

  if (key === 'errors' && hasErrors(lang) && slug.length === 2) permanentRedirect(sectionHref(lang, 'errors'))
  if (key === 'errors' && hasErrors(lang) && slug.length <= 4) {
    const home = { name: t.ui.home, href: `/${lang}` }
    const section = { name: t.ui.errTitle, href: sectionHref(lang, 'errors') }
    if (slug.length === 1) {
      const groups = await Promise.all((Object.keys(APPLIANCES) as Appliance[]).map(async (a) => {
        const cat = await getCategoryByKey(lang, a)
        const seg = cat?.slug ?? applianceName(lang, a).slug
        return { name: cat?.name ?? applianceName(lang, a).many, brands: errorBrands(a).map((b) => ({ brand: b.brand, n: b.n, href: sectionHref(lang, 'errors', seg, b.slug) })) }
      }))
      return <ErrorsIndex t={t} crumbs={[home, section]} groups={groups} />
    }
    const ap = await applianceOf(lang, slug[1])
    if (!ap) notFound()
    const base = sectionHref(lang, 'errors', ap.slug, slug[2])
    const codes = errorCodes(lang, ap.key, slug[2])
    if (!codes.length) notFound()
    const brand = codes[0].brand
    const brandTitle = fill(t.ui.errBrandTitle, { brand, appliance: singular(t, ap.key, lang) })
    const brandCrumb = { name: brandTitle, href: base }
    if (slug.length === 3) return <ErrorsBrand t={t} crumbs={[home, section, brandCrumb]} title={brandTitle} codes={codes} base={base} />
    const r = errorCode(lang, ap.key, slug[2], slug[3])
    if (!r) notFound()
    if (r.item.slug !== slug[3]) permanentRedirect(`${base}/${r.item.slug}`)
    const cat = await getCategoryByKey(lang, ap.key)
    const models = cat ? (await getCategoryProducts(lang, cat)).filter((p) => p.brand === brand && p.image).slice(0, 4) : []
    const title = fill(t.ui.errCodeTitle, { brand, appliance: singular(t, ap.key, lang), code: r.item.code })
    return <ErrorsCode lang={lang} t={t} crumbs={[home, section, brandCrumb, { name: r.item.code, href: `${base}/${r.item.slug}` }]}
      title={title} item={r.item} others={r.others} base={base} models={models} catHref={ap.href} />
  }

  if (key === 'best' && slug.length <= 3) {
    const home = { name: t.ui.home, href: `/${lang}` }
    const section = { name: t.ui.bestIndexTitle, href: sectionHref(lang, 'best') }
    if (slug.length === 1) {
      // индекс: все категории и их «топы»
      const cats = await Promise.all((await getCategories(lang)).map(async (c) => {
        const cat = await getCategory(lang, c.slug)
        return cat ? { cat, specs: await getBestSpecs(lang, cat) } : null
      }))
      return (
        <>
          <Breadcrumbs items={[home, section]} />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t.ui.bestIndexTitle}</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cats.filter((x) => x && x.specs.length).map((x) => (
              <section key={x!.cat.key} className="rounded-2xl border border-border p-4">
                <h2 className="mb-2 font-semibold"><a href={`/${lang}/${x!.cat.slug}`} className="hover:text-accent">{x!.cat.name}</a></h2>
                <ul className="space-y-1 text-sm">
                  {x!.specs.map((sp) => <li key={sp.slug}><a href={sectionHref(lang, 'best', x!.cat.slug, sp.slug)} className="text-accent hover:underline">{sp.label}</a></li>)}
                </ul>
              </section>
            ))}
          </div>
        </>
      )
    }
    const cat = slug.length === 3 ? await getCategory(lang, slug[1]) : null
    const b = cat && await getBest(lang, cat, slug[2])
    if (!cat || !b || !b.items.length) notFound()
    const title = fill(t.ui.bestTitle, { category: cat.name, n: b.items.length, spec: b.label })
    const more = (await getBestSpecs(lang, cat)).filter((x) => x.slug !== slug[2])
      .map((x) => ({ label: fill(t.ui.bestTitle, { category: cat.name, n: 20, spec: x.label }), href: sectionHref(lang, 'best', cat.slug, x.slug) }))
    return <BestView lang={lang} t={t} title={title} desc={fill(t.ui.bestDesc, { n: b.items.length, spec: b.label, total: b.total })} items={b.items} more={more}
      crumbs={[home, section, { name: cat.name, href: `/${lang}/${cat.slug}` }, { name: b.label, href: sectionHref(lang, 'best', cat.slug, slug[2]) }]} />
  }

  if (key === 'compare' && slug.length <= 2) {
    const home = { name: t.ui.home, href: `/${lang}` }
    const section = { name: t.nav.compare, href: sectionHref(lang, 'compare') }
    if (slug.length === 1) {
      const top = await getTopComparisons(lang, 90)
      return (
        <>
          <Breadcrumbs items={[home, section]} />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t.nav.compare}</h1>
          <div className="mt-6 max-w-2xl">
            <ComparePicker lang={lang} base={sectionHref(lang, 'compare')} s={t.ui} />
          </div>
          <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((c) => (
              <li key={c.href}><a href={c.href} className="block rounded-xl border border-border px-4 py-3 text-sm font-medium hover:border-accent">{c.name}</a></li>
            ))}
          </ul>
          <CompareTray s={t.ui} />
        </>
      )
    }
    const c = await getComparison(lang, slug[1])
    if (!c) notFound()
    if (c.known && c.canonical !== `${sectionHref(lang, 'compare')}/${slug[1]}`) permanentRedirect(c.canonical)
    // радар: оси — характеристики, по которым есть место в категории у обеих моделей
    const pos = 'cross' in c ? [] : await Promise.all(c.items.map((it) => getPositions(lang, c.cat, it.specGroups.flatMap((g) => g.specs), 30)))
    const axes = (pos[0] ?? []).filter((x) => pos.every((p) => p.some((y) => y.key === x.key))).slice(0, 8)
    const radar = axes.length >= 3 ? { axes: axes.map((x) => x.label),
      series: c.items.map((it, k) => ({ name: `${it.brand} ${it.name}`, values: axes.map((x) => pos[k].find((y) => y.key === x.key)!.better) })) } : undefined
    return (
      <CompareView lang={lang} t={t} items={c.items} radar={radar}
        crumbs={[home, 'cross' in c ? { name: t.nav.compare, href: sectionHref(lang, 'compare') } : { name: c.cat.name, href: `/${lang}/${c.cat.slug}` }, { name: c.items.map((x) => x.name).join(` ${t.ui.vs} `), href: c.canonical }]} />
    )
  }

  if (!key && slug.length === 3 && slug[2] === MANUAL_SLUG[lang]) {
    const cat = await getCategory(lang, slug[0])
    const p = cat && await getProduct(lang, cat, slug[1])
    if (!cat || !p || !p.docs.length) notFound()
    const name = `${p.brand} ${p.name}`
    const title = fill(p.docs.some((d) => d.kind === 'manual') ? t.ui.manualPageTitle : t.ui.docsPageTitle, { name })
    return (
      <>
        <Breadcrumbs items={[{ name: t.ui.home, href: `/${lang}` }, { name: cat.name, href: `/${lang}/${cat.slug}` }, { name, href: p.href }, { name: t.ui.docsTitle, href: `${p.href}/${MANUAL_SLUG[lang]}` }]} />
        <div className="grid gap-6 md:grid-cols-[14rem_1fr] md:items-start">
          <a href={p.href} className="block rounded-2xl border border-border p-3"><ProductImage src={p.image} alt={name} /></a>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
            <p className="mt-2 text-muted">{fill(t.ui.docsLead, { name })}</p>
            <div className="mt-5"><DocsList t={t} docs={p.docs} big /></div>
            <p className="mt-3 text-xs text-muted">{t.ui.docsNote}</p>
            <ul className="mt-6 flex flex-wrap gap-1.5">{p.keySpecs.slice(0, 6).map((k) => <li key={k.key} className="num rounded-md bg-surface px-2 py-1 text-sm">{k.label}: {k.display}</li>)}</ul>
            <a href={p.href} className="mt-4 inline-block font-medium text-accent hover:underline">{t.ui.allSpecs} →</a>
          </div>
        </div>
      </>
    )
  }

  if (!key && slug.length <= 2) {
    const cat = await getCategory(lang, slug[0])
    if (cat) {
      const home = { name: t.ui.home, href: `/${lang}` }
      const catCrumb = { name: cat.name, href: `/${lang}/${cat.slug}` }
      if (slug.length === 1) {
        const items = await getCategoryProducts(lang, cat)
        const count = new Map<string, number>()
        items.forEach((i) => count.set(i.brand, (count.get(i.brand) ?? 0) + 1))
        const brands = [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)!)
        const filters = await getFilterDefs(lang, cat)
        const tops = (await getBestSpecs(lang, cat)).map((x) => ({ label: x.label, href: sectionHref(lang, 'best', cat.slug, x.slug) }))
        return <CategoryView lang={lang} t={t} title={cat.name} items={items} brands={brands} crumbs={[home, catCrumb]} tops={tops} trends={await getTrends(lang, cat)}
          browser={{ filters, compare: { cat: cat.key, base: sectionHref(lang, 'compare') } }}
          extra={hasErrors(lang) && isAppliance(cat.key) ? { label: t.ui.errTitle, href: sectionHref(lang, 'errors') }
            : TOOLS.find((x) => x.cat === cat.key) ? { label: toolsText(lang)[TOOLS.find((x) => x.cat === cat.key)!.key].short, href: sectionHref(lang, 'tools', TOOLS.find((x) => x.cat === cat.key)!.id) } : undefined} />
      }
      const p = await getProduct(lang, cat, slug[1])
      if (p) {
        const gb = (v: number | null) => (v == null ? '' : v >= 1024 ? `${number(lang, v / 1024)} TB` : `${number(lang, v)} GB`)
        const variants = [...new Set(p.variants.filter((v) => v.storage).sort((a, b) => (a.storage ?? 0) - (b.storage ?? 0))
          .map((v) => (v.ram ? `${gb(v.ram)} / ${gb(v.storage)}` : gb(v.storage))))]
        const year = (p.updatedAt ?? '').slice(0, 4) || '2026'
        return (
          <>
            <ProductView lang={lang} t={t} p={p} crumbs={[home, catCrumb, { name: `${p.brand} ${p.name}`, href: p.href }]}
              compareLinks={await getCompareLinks(lang, p.slug)} variants={variants} gallery={p.images} credits={p.credits}
              support={cat.key === 'smartphones' || cat.key === 'tablets' ? supportFor(p.brand, p.name, p.releaseDate ?? null) : null}
              docs={p.docs} docsHref={p.docs.length ? `${p.href}/${MANUAL_SLUG[lang]}` : undefined}
              compare={{ cat: cat.key, base: sectionHref(lang, 'compare') }}
              positions={await getPositions(lang, cat, p.specGroups.flatMap((g) => g.specs))}
              cost={costInput(lang, cat.key, p.specGroups.flatMap((g) => g.specs))}
              better={await getBetterAlternatives(lang, cat, { slug: p.slug, release: p.releaseDate, keySpecs: p.keySpecs })}
              cross={await getCrossLinks(lang, cat, { slug: p.slug, brand: p.brand })}
              extra={hasErrors(lang) && isAppliance(cat.key) && errorCodes(lang, cat.key, slugify(p.brand)).length
                ? { title: t.ui.errTitle, links: [{ name: fill(t.ui.errBrandTitle, { brand: p.brand, appliance: applianceName(lang, cat.key).one }), href: sectionHref(lang, 'errors', cat.slug, slugify(p.brand)) }] } : undefined}
              prevGen={await getPrevGeneration(lang, cat, p.brand, p.name).then((g) => g && { name: `${g.brand} ${g.name}`, href: g.href, specs: g.specGroups.flatMap((x) => x.specs) })}
              attribution={p.source === 'icecat' ? `Database Right data-sheet ${year} Icecat. All rights reserved. Data provided “as is” without warranty.` : undefined} />
            <ProductJsonLd name={`${p.brand} ${p.name}`} brand={p.brand} image={p.images} url={p.href} />
          </>
        )
      }
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

/** Разметка Product без цен и оценок (их пока нет — не выдумываем). */
function ProductJsonLd({ name, brand, image, url }: { name: string; brand: string; image: string[]; url: string }) {
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name, brand: { '@type': 'Brand', name: brand }, image: image.slice(0, 3), url: `https://specvane.com${url}` }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
}
