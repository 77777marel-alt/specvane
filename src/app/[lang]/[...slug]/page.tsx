// Единый разборщик адресов языка: /de/impressum, /de/vergleich/…, /de/beamer, /de/beamer/epson-…
// Разделы с адресами на языке страны берутся из lib/routes.ts. Этап 0: инфо-страницы и категории.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { INFO_PAGES, resolveSlug, sectionHref, type InfoPage } from '@/lib/routes'
import { getCategory, getCategoryProducts, getProduct, getComparison, getCompareLinks, getTopComparisons, getFilterDefs, getPositions, getPrevGeneration, getBest, getBestSpecs, getBetterAlternatives, getCrossLinks, getTrends, getCategoryByKey } from '@/lib/catalog'
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
import { APPLIANCES, errorBrands, errorCode, errorCodes, hasErrors, ERROR_LANGS, slugify, isAppliance, type Appliance } from '@/lib/errors'
import { ErrorsBrand, ErrorsCode, ErrorsIndex } from '@/components/views/ErrorsView'
import { CompareTray } from '@/components/compare/CompareTray'

const PREVIEW = 'design-preview'


// ---------- коды ошибок: /<lang>/<error-codes>/<категория>/<бренд>/<код> ----------
async function applianceOf(lang: Locale, seg: string): Promise<{ key: Appliance; name: string; slug: string; href: string | null } | null> {
  for (const key of Object.keys(APPLIANCES) as Appliance[]) {
    const cat = await getCategoryByKey(lang, key)
    const slug = cat?.slug ?? key
    if (slug === seg) return { key, name: cat?.name ?? key, slug, href: cat ? `/${lang}/${cat.slug}` : null }
  }
  return null
}
const singular = (t: ReturnType<typeof getDict>, a: Appliance) => (a === 'dishwashers' ? t.ui.errDishwasher : t.ui.errWasher)
async function errorsMeta(lang: Locale, slug: string[]): Promise<Metadata> {
  const t = getDict(lang)
  if (!hasErrors(lang)) return {}
  const alt = (...rest: string[]) => alternates(lang, (l) => (ERROR_LANGS.includes(l) ? sectionHref(l, 'errors', ...rest) : null))
  if (slug.length === 1) return { title: `${t.ui.errTitle} · Specvane`, description: t.ui.errLead, alternates: alt() }
  const ap = await applianceOf(lang, slug[1])
  if (!ap) return {}
  if (slug.length === 3) {
    const codes = errorCodes(lang, ap.key, slug[2])
    if (!codes.length) return {}
    const title = fill(t.ui.errBrandTitle, { brand: codes[0].brand, appliance: singular(t, ap.key) })
    return { title: `${title} · Specvane`, description: codes.slice(0, 8).map((c) => `${c.code}: ${c.title}`).join('; ').slice(0, 300), alternates: alt(slug[1], slug[2]) }
  }
  if (slug.length === 4) {
    const r = errorCode(lang, ap.key, slug[2], slug[3])
    if (!r) return {}
    const title = fill(t.ui.errCodeTitle, { brand: r.item.brand, appliance: singular(t, ap.key), code: r.item.code })
    return { title: `${title}: ${r.item.title} · Specvane`, description: `${r.item.title}. ${r.item.causes[0] ?? ''} ${r.item.steps[0] ?? ''}`.slice(0, 300),
      alternates: alt(slug[1], slug[2], r.item.slug) }
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

  if (key === 'errors' && hasErrors(lang) && slug.length === 2) permanentRedirect(sectionHref(lang, 'errors'))
  if (key === 'errors' && hasErrors(lang) && slug.length <= 4) {
    const home = { name: t.ui.home, href: `/${lang}` }
    const section = { name: t.ui.errTitle, href: sectionHref(lang, 'errors') }
    if (slug.length === 1) {
      const groups = await Promise.all((Object.keys(APPLIANCES) as Appliance[]).map(async (a) => {
        const cat = await getCategoryByKey(lang, a)
        const seg = cat?.slug ?? a
        return { name: cat?.name ?? a, brands: errorBrands(a).map((b) => ({ brand: b.brand, n: b.n, href: sectionHref(lang, 'errors', seg, b.slug) })) }
      }))
      return <ErrorsIndex t={t} crumbs={[home, section]} groups={groups} />
    }
    const ap = await applianceOf(lang, slug[1])
    if (!ap) notFound()
    const base = sectionHref(lang, 'errors', ap.slug, slug[2])
    const codes = errorCodes(lang, ap.key, slug[2])
    if (!codes.length) notFound()
    const brand = codes[0].brand
    const brandTitle = fill(t.ui.errBrandTitle, { brand, appliance: singular(t, ap.key) })
    const brandCrumb = { name: brandTitle, href: base }
    if (slug.length === 3) return <ErrorsBrand t={t} crumbs={[home, section, brandCrumb]} title={brandTitle} codes={codes} base={base} />
    const r = errorCode(lang, ap.key, slug[2], slug[3])
    if (!r) notFound()
    if (r.item.slug !== slug[3]) permanentRedirect(`${base}/${r.item.slug}`)
    const cat = await getCategoryByKey(lang, ap.key)
    const models = cat ? (await getCategoryProducts(lang, cat)).filter((p) => p.brand === brand && p.image).slice(0, 4) : []
    const title = fill(t.ui.errCodeTitle, { brand, appliance: singular(t, ap.key), code: r.item.code })
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
          extra={hasErrors(lang) && isAppliance(cat.key) ? { label: t.ui.errTitle, href: sectionHref(lang, 'errors') } : undefined} />
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
              compare={{ cat: cat.key, base: sectionHref(lang, 'compare') }}
              positions={await getPositions(lang, cat, p.specGroups.flatMap((g) => g.specs))}
              cost={costInput(lang, cat.key, p.specGroups.flatMap((g) => g.specs))}
              better={await getBetterAlternatives(lang, cat, { slug: p.slug, release: p.releaseDate, keySpecs: p.keySpecs })}
              cross={await getCrossLinks(lang, cat, { slug: p.slug, brand: p.brand })}
              extra={hasErrors(lang) && isAppliance(cat.key) && errorCodes(lang, cat.key, slugify(p.brand)).length
                ? { title: t.ui.errTitle, links: [{ name: fill(t.ui.errBrandTitle, { brand: p.brand, appliance: cat.key === 'dishwashers' ? t.ui.errDishwasher : t.ui.errWasher }), href: sectionHref(lang, 'errors', cat.slug, slugify(p.brand)) }] } : undefined}
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
