// Единый разборщик адресов языка: /de/impressum, /de/vergleich/…, /de/beamer, /de/beamer/epson-…
// Разделы с адресами на языке страны берутся из lib/routes.ts. Этап 0: инфо-страницы и категории.
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, LOCALES, type Locale } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n'
import { INFO_PAGES, MANUAL_SLUG, SLUGS, resolveSlug, sectionHref, type InfoPage } from '@/lib/routes'
import { getCategory, getCategoryProducts, getProduct, getComparison, getCompareLinks, getTopComparisons, getFilterDefs, getPositions, getPrevGeneration, getBest, getBestSpecs, getBetterAlternatives, getCrossLinks, getTrends, getCategoryByKey, getGlossaryLinks, getCategoryBrands, getBrandPairs, getBrandVs, todayMs, getLists, getListItems, getOverall, getUseCases } from '@/lib/catalog'
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
import { costInput, defaultTariff } from '@/lib/costs'
import { ComparePicker } from '@/components/compare/ComparePicker'
import { APPLIANCES, errorBrands, errorCode, errorCodes, hasErrors, ERROR_LANGS, slugify, isAppliance, applianceFor, applianceName, isThinCode, type Appliance } from '@/lib/errors'
import { ErrorsBrand, ErrorsCode, ErrorsIndex } from '@/components/views/ErrorsView'
import { DocsList } from '@/components/product/DocsList'
import { supportFor } from '@/lib/updates'
import { TOOLS, toolsText } from '@/lib/tools'
import { ToolCalc } from '@/components/views/ToolCalc'
import { RealSize } from '@/components/views/RealSize'
import { FitFinder } from '@/components/views/FitFinder'
import { lifeFacts, lifeText } from '@/lib/life'
import { rightsFor } from '@/lib/rights'
import { osUi, osList, osEntry, osName, osForProduct, slugCandidates } from '@/lib/osupdates'
import { Duel } from '@/components/views/Duel'
import { duelGroups, duelText } from '@/lib/duel'
import { glossary, glossaryTerm, GLOSSARY_UI } from '@/lib/glossary'
import { brandsText } from '@/lib/brands'
import { listsText, listTitle } from '@/lib/lists'
import { useCasesText, ucItem } from '@/lib/usecases'
import { widgetsText } from '@/lib/widgets'
import { productHrefsBySlugs } from '@/lib/catalog'
import { reportText, REPORT_SLUG, REPORT_CATS, brandSupport } from '@/lib/reports'
import { ShareEmbed } from '@/components/ShareEmbed'
import { SITE_URL } from '@/lib/site'
import { overallText } from '@/lib/overall'
import { legalText } from '@/lib/legal'
import { productFaq, faqText } from '@/lib/faq'
import { ProductCard } from '@/components/product/ProductCard'
import { guides, guideFor, GUIDE_CATS, GUIDE_UI, type Guide } from '@/lib/guides'
import { ProductImage } from '@/components/product/ProductImage'
import { CompareTray } from '@/components/compare/CompareTray'

const PREVIEW = 'design-preview'


// ---------- гиды «Как выбрать»: /<lang>/<guides>/<адрес категории> ----------
async function guideSeg(lang: Locale, cat: string): Promise<string> {
  return (await getCategoryByKey(lang, cat))?.slug ?? (isAppliance(cat) ? applianceName(lang, cat).slug : cat)
}
async function guideBySeg(lang: Locale, seg: string): Promise<Guide | null> {
  for (const c of GUIDE_CATS) if ((await guideSeg(lang, c)) === seg) return guideFor(lang, c) ?? null
  return null
}

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
      openGraph: { images: [{ url: `/og/${lang}/error/${ap.key}/${slug[2]}/${r.item.slug}.png`, width: 1200, height: 630 }] },
      alternates: altAp(slug[2], r.item.slug), robots: isThinCode(ap.key, r.item.brand, r.item.code) ? { index: false, follow: true } : undefined }
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
  if (key === 'lists' && (slug.length === 2 || slug.length === 3)) {
    const cat = await getCategory(lang, slug[1])
    if (!cat) return {}
    const lt = listsText(lang)
    if (slug.length === 2) return { title: `${fill(lt.indexTitle, { category: cat.name })} · Specvane`, description: lt.indexLead,
      alternates: alternates(lang, (l) => (cat.slugs[l] ? sectionHref(l, 'lists', cat.slugs[l]!) : null)) }
    const uc = (await getUseCases(lang, cat)).find((x) => x.uc.slug === slug[2])
    if (uc) {
      const it = ucItem(lang, uc.uc.slug)
      return { title: `${it.title} · Specvane`, description: `${it.lead} ${uc.items.slice(0, 4).map((p) => `${p.brand} ${p.name}`).join(', ')}`.slice(0, 300),
        alternates: alternates(lang, (l) => (cat.slugs[l] ? sectionHref(l, 'lists', cat.slugs[l]!, slug[2]) : null)), robots: uc.items.length >= 10 ? undefined : { index: false, follow: true } }
    }
    const r = await getListItems(lang, cat, slug[2])
    if (!r) return {}
    const title = listTitle(lang, cat.name, r.def)
    return { title: `${title} · Specvane`, description: `${fill(lt.lead, { n: r.items.length })} ${r.items.slice(0, 5).map((p) => `${p.brand} ${p.name}`).join(', ')}`.slice(0, 300),
      alternates: alternates(lang, (l) => (cat.slugs[l] ? sectionHref(l, 'lists', cat.slugs[l]!, slug[2]) : null)) }
  }
  if (key === 'brands' && (slug.length === 2 || slug.length === 3)) {
    const cat = await getCategory(lang, slug[1])
    if (!cat) return {}
    const bt = brandsText(lang)
    const alt = (...rest: string[]) => alternates(lang, (l) => (cat.slugs[l] ? sectionHref(l, 'brands', cat.slugs[l]!, ...rest) : null))
    if (slug.length === 2) return { title: `${fill(bt.indexTitle, { category: cat.name })} · Specvane`, description: bt.indexLead, alternates: alt() }
    const m = slug[2].match(/^(.+?)-vs-(.+)$/)
    const v = m ? await getBrandVs(lang, cat, m[1], m[2]) : null
    if (!v) return {}
    const top = (await getBrandPairs(lang, cat, 6)).some((x) => x.a.slug === v.a.slug && x.b.slug === v.b.slug)
    const index = top && v.both >= 3 && GUIDE_CATS.includes(cat.key)
    return { title: `${fill(bt.vsTitle, { a: v.a.name, b: v.b.name, category: cat.name })} · Specvane`,
      description: fill(bt.vsLead, { a: v.a.name, b: v.b.name, m: v.both, na: v.a.recent >= 5 ? v.a.recent : v.a.n, nb: v.b.recent >= 5 ? v.b.recent : v.b.n }).slice(0, 300),
      alternates: alt(slug[2]), robots: index ? undefined : { index: false, follow: true },
      openGraph: { images: [{ url: `/og/${lang}/brands/${cat.slug}/${v.a.slug}-vs-${v.b.slug}.png`, width: 1200, height: 630 }] } }
  }
  if (key === 'guides') {
    const g = GUIDE_UI[lang]
    if (slug.length === 1) return { title: `${g.title} · Specvane`, description: g.lead, alternates: alternates(lang, (l) => sectionHref(l, 'guides')) }
    const gd = slug.length === 2 ? await guideBySeg(lang, slug[1]) : null
    if (!gd) return {}
    const segs = Object.fromEntries(await Promise.all(LOCALES.map(async (l) => [l, await guideSeg(l, gd.cat)] as const)))
    return { title: `${gd.title} · Specvane`, description: gd.lead, alternates: alternates(lang, (l) => sectionHref(l, 'guides', segs[l])), openGraph: { title: gd.title, images: [{ url: `/og/${lang}/guide/${gd.cat}.png`, width: 1200, height: 630 }] } }
  }
  if (key === 'updates' && slug.length <= 2) {
    const u = osUi(lang)
    if (slug.length === 1) return { title: `${u.indexTitle} · Specvane`, description: u.indexLead, alternates: alternates(lang, (l) => sectionHref(l, 'updates')) }
    const e = osEntry(lang, slug[1])
    if (!e) return {}
    const os = osName(e)
    return { title: `${fill(u.title, { os })} · Specvane`, description: fill(u.metaDesc, { os, n: e.devices.length }), alternates: alternates(lang, (l) => sectionHref(l, 'updates', e.slug)) }
  }
  if (key === 'reports' && slug.length <= 2) {
    if (slug.length === 2 && slug[1] !== REPORT_SLUG) return {}
    const r = reportText(lang)
    return { title: `${r.title} · Specvane`, description: r.lead, alternates: alternates(lang, (l) => sectionHref(l, 'reports', REPORT_SLUG)),
      openGraph: { title: r.title, images: [{ url: `/og/${lang}/report/${REPORT_SLUG}.png`, width: 1200, height: 630 }] } }
  }
  if (key === 'widgets' && slug.length === 1) {
    const w = widgetsText(lang)
    return { title: `${w.pageTitle} · Specvane`, description: w.pageLead, alternates: alternates(lang, (l) => sectionHref(l, 'widgets')) }
  }
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
    if (slug.length === 2) {
      const c = await getCategory(lang, slug[1])
      const top = c ? await getOverall(lang, c) : []
      if (!c || top.length < 5) return {}
      const ot = overallText(lang)
      return { title: `${fill(ot.title, { category: c.name, n: top.length })} · Specvane`, description: `${top.slice(0, 5).map((x, i) => `${i + 1}. ${x.brand} ${x.name}`).join(', ')}`.slice(0, 300),
        alternates: alternates(lang, (l) => (c.slugs[l] ? sectionHref(l, 'best', c.slugs[l]!) : null)) }
    }
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
        {key === 'legal-notice' && legalText(lang).legal.map((p, i) => (
          <p key={`l${i}`} className="mb-4 leading-relaxed text-muted">{p}</p>
        ))}
      </article>
    )
  }

  if (key === 'lists' && (slug.length === 2 || slug.length === 3)) {
    const cat = await getCategory(lang, slug[1])
    if (!cat) notFound()
    const lt = listsText(lang)
    const home = { name: t.ui.home, href: `/${lang}` }
    const catCrumb = { name: cat.name, href: `/${lang}/${cat.slug}` }
    const idx = { name: lt.section, href: sectionHref(lang, 'lists', cat.slug) }
    const [lists, ucsAll] = await Promise.all([getLists(lang, cat), getUseCases(lang, cat)])
    const ucs = ucsAll.filter((x) => x.items.length >= 5)
    if (!lists.length && !ucs.length) notFound()
    const ut = useCasesText(lang)
    const ucLinks = (skip?: string) => ucs.filter((x) => x.uc.slug !== skip).map((x) => ({ label: `${ucItem(lang, x.uc.slug).title} (${x.items.length})`, href: sectionHref(lang, 'lists', cat.slug, x.uc.slug) }))
    const links = (skip?: string) => lists.filter((x) => x.slug !== skip).map((x) => ({ label: `${listTitle(lang, cat.name, x)} (${x.n})`, href: sectionHref(lang, 'lists', cat.slug, x.slug) }))
    if (slug.length === 2) {
      return (
        <>
          <Breadcrumbs items={[home, catCrumb, idx]} />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{fill(lt.indexTitle, { category: cat.name })}</h1>
          <p className="mt-2 max-w-2xl text-muted">{lt.indexLead}</p>
          {ucs.length > 0 && <>
            <h2 className="mb-3 mt-8 text-xl font-semibold">{ut.section}</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{ucLinks().map((x) => <li key={x.href}><a href={x.href} className="flex min-h-11 items-center rounded-xl border border-border px-3 py-2 font-medium hover:border-accent hover:text-accent">{x.label}</a></li>)}</ul>
            <h2 className="mb-3 mt-8 text-xl font-semibold">{lt.section}</h2>
          </>}
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{links().map((x) => <li key={x.href}><a href={x.href} className="flex min-h-11 items-center rounded-xl border border-border px-3 py-2 hover:border-accent hover:text-accent">{x.label}</a></li>)}</ul>
        </>
      )
    }
    const u = ucsAll.find((x) => x.uc.slug === slug[2])
    if (u) {
      const it = ucItem(lang, u.uc.slug)
      if (!u.items.length) notFound()
      return (
        <>
          <CategoryView lang={lang} t={t} title={it.title} intro={`${it.lead} ${fill(lt.lead, { n: u.items.length })}`} items={u.items.slice(0, 96)}
            crumbs={[home, catCrumb, idx, { name: it.title, href: sectionHref(lang, 'lists', cat.slug, slug[2]) }]}
            extra={[{ label: lt.all, href: sectionHref(lang, 'lists', cat.slug) }]} />
          <section className="mt-6 rounded-2xl border border-border p-4" aria-label={ut.criteria}>
            <h2 className="mb-2 font-semibold">{ut.criteria}</h2>
            <ul className="flex flex-wrap gap-2 text-sm">{u.criteria.map((c) => <li key={c.label} className="rounded-lg bg-surface px-2.5 py-1"><span className="text-muted">{c.label}:</span> <span className="num font-medium">{c.text}</span></li>)}</ul>
          </section>
          <nav className="mt-10" aria-label={ut.section}>
            <h2 className="mb-3 font-semibold">{ut.section}</h2>
            <ul className="flex flex-wrap gap-2">{ucLinks(slug[2]).map((x) => <li key={x.href}><a href={x.href} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm hover:border-accent hover:text-accent">{x.label}</a></li>)}</ul>
          </nav>
        </>
      )
    }
    const r = await getListItems(lang, cat, slug[2])
    if (!r) notFound()
    const title = listTitle(lang, cat.name, r.def)
    return (
      <>
        <CategoryView lang={lang} t={t} title={title} intro={fill(lt.lead, { n: r.items.length })} items={r.items.slice(0, 96)} crumbs={[home, catCrumb, idx, { name: title, href: sectionHref(lang, 'lists', cat.slug, slug[2]) }]}
          extra={[{ label: lt.all, href: sectionHref(lang, 'lists', cat.slug) }]} />
        <nav className="mt-10" aria-label={lt.more}>
          <h2 className="mb-3 font-semibold">{lt.more}</h2>
          <ul className="flex flex-wrap gap-2">{links(slug[2]).slice(0, 16).map((x) => <li key={x.href}><a href={x.href} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm hover:border-accent hover:text-accent">{x.label}</a></li>)}</ul>
        </nav>
      </>
    )
  }

  if (key === 'brands' && (slug.length === 2 || slug.length === 3)) {
    const cat = await getCategory(lang, slug[1])
    if (!cat) notFound()
    const bt = brandsText(lang)
    const home = { name: t.ui.home, href: `/${lang}` }
    const catCrumb = { name: cat.name, href: `/${lang}/${cat.slug}` }
    const idx = { name: bt.section, href: sectionHref(lang, 'brands', cat.slug) }
    const pairs = await getBrandPairs(lang, cat, 6)
    const pairLinks = (skip?: string) => pairs.filter((x) => x.href !== skip).slice(0, 15).map((x) => (
      <li key={x.href}><a href={x.href} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 hover:border-accent hover:text-accent">{x.a.name} vs {x.b.name}</a></li>
    ))
    if (slug.length === 2) {
      const brands = await getCategoryBrands(cat)
      if (brands.length < 2) notFound()
      return (
        <>
          <Breadcrumbs items={[home, catCrumb, idx]} />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{fill(bt.indexTitle, { category: cat.name })}</h1>
          <p className="mt-2 max-w-2xl text-muted">{bt.indexLead}</p>
          <h2 className="mb-3 mt-8 text-xl font-semibold">{bt.pairs}</h2>
          <ul className="flex flex-wrap gap-2">{pairLinks()}</ul>
          <h2 className="mb-3 mt-8 text-xl font-semibold">{bt.brandsList}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => <li key={b.slug} className="flex items-center justify-between rounded-xl border border-border px-3 py-2"><span className="font-medium">{b.name}</span><span className="text-sm text-muted">{fill(bt.models, { n: b.n })}{b.newest ? ` · ${b.newest.slice(0, 4)}` : ''}</span></li>)}
          </ul>
        </>
      )
    }
    const m = slug[2].match(/^(.+?)-vs-(.+)$/)
    if (!m) notFound()
    if (m[1] > m[2]) permanentRedirect(sectionHref(lang, 'brands', cat.slug, `${m[2]}-vs-${m[1]}`))
    const v = await getBrandVs(lang, cat, m[1], m[2])
    if (!v) notFound()
    const { a, b } = v
    const summary = v.wa === v.wb ? fill(bt.tie, { a: a.name, b: b.name, n: v.wa }) : fill(bt.ahead, { brand: v.wa > v.wb ? a.name : b.name, n: Math.max(v.wa, v.wb), m: v.both })
    const cell = (x: { med: string; top: string } | null, win: boolean) => (
      <td className={`px-3 py-2 align-top ${win ? 'bg-good-soft font-semibold text-good' : ''}`}>{x ? <><span className="num">{x.med}</span><span className="block text-xs text-muted">{bt.best}: <span className="num">{x.top}</span></span></> : '—'}</td>
    )
    const g = guideFor(lang, cat.key)
    return (
      <article>
        <Breadcrumbs items={[home, catCrumb, idx, { name: `${a.name} vs ${b.name}`, href: sectionHref(lang, 'brands', cat.slug, slug[2]) }]} />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{fill(bt.vsTitle, { a: a.name, b: b.name, category: cat.name })}</h1>
        <p className="mt-2 max-w-3xl text-muted">{fill(bt.vsLead, { a: a.name, b: b.name, m: v.both, na: a.recent >= 5 ? a.recent : a.n, nb: b.recent >= 5 ? b.recent : b.n })}</p>
        <p className="mt-4 inline-block rounded-xl bg-surface px-4 py-3 text-lg font-semibold">{summary}</p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-start"><tr><th className="px-3 py-2 text-start">{bt.spec}</th><th className="px-3 py-2 text-start">{a.name}</th><th className="px-3 py-2 text-start">{b.name}</th></tr></thead>
            <tbody>
              <tr className="border-t border-border"><td className="px-3 py-2">{bt.catalog}</td><td className="num px-3 py-2">{a.n}</td><td className="num px-3 py-2">{b.n}</td></tr>
              {(a.newest || b.newest) && <tr className="border-t border-border"><td className="px-3 py-2">{bt.newest}</td><td className="num px-3 py-2">{a.newest?.slice(0, 4) ?? '—'}</td><td className="num px-3 py-2">{b.newest?.slice(0, 4) ?? '—'}</td></tr>}
              {v.rows.map((r) => <tr key={r.key} className="border-t border-border"><td className="px-3 py-2">{r.label}<span className="block text-xs text-muted">{bt.typical}</span></td>{cell(r.a, r.win === 'a')}{cell(r.b, r.win === 'b')}</tr>)}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-muted">{bt.method}</p>
        <p className="mt-2 max-w-3xl text-xs text-muted">{legalText(lang).rank}</p>
        {[[a, v.latestA], [b, v.latestB]].map(([br, items]) => (items as typeof v.latestA).length > 0 && (
          <section key={(br as typeof a).slug} className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">{fill(bt.latest, { brand: (br as typeof a).name })}</h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{(items as typeof v.latestA).map((p) => <li key={p.slug}><ProductCard lang={lang} p={p} /></li>)}</ul>
          </section>
        ))}
        <nav className="mt-8" aria-label={bt.pairs}>
          <h2 className="mb-3 font-semibold">{bt.pairs}</h2>
          <ul className="flex flex-wrap gap-2">{pairLinks(sectionHref(lang, 'brands', cat.slug, slug[2]))}</ul>
        </nav>
        <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1">
          <a href={`/${lang}/${cat.slug}`} className="font-medium text-accent hover:underline">{fill(bt.seeAll, { category: cat.name })} →</a>
          {g && <a href={sectionHref(lang, 'guides', cat.slug)} className="font-medium text-accent hover:underline">{g.title} →</a>}
        </p>
      </article>
    )
  }

  if (key === 'updates' && slug.length <= 2) {
    const u = osUi(lang)
    const section = { name: u.section, href: sectionHref(lang, 'updates') }
    const fmt = (d: string) => new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d))
    const all = osList(lang)
    if (slug.length === 1) {
      const vendors = [...new Set(all.map((x) => x.vendor))]
      return (
        <>
          <Breadcrumbs items={[{ name: t.ui.home, href: `/${lang}` }, section]} />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{u.indexTitle}</h1>
          <p className="mt-2 max-w-2xl text-muted">{u.indexLead}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">{vendors.map((v) => (
            <section key={v} className="rounded-2xl border border-border p-4">
              <h2 className="mb-2 text-lg font-semibold">{v}</h2>
              <ul className="space-y-1">{all.filter((x) => x.vendor === v).map((x) => (
                <li key={x.slug}><a href={sectionHref(lang, 'updates', x.slug)} className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 hover:bg-surface">
                  <span className="font-medium">{osName(x)}</span><span className="num text-sm text-muted">{x.devices.length}{x.released ? ` · ${x.released.slice(0, 4)}` : ''}</span></a></li>
              ))}</ul>
            </section>
          ))}</div>
        </>
      )
    }
    const e = osEntry(lang, slug[1])
    if (!e) notFound()
    const os = osName(e)
    const hrefs = await productHrefsBySlugs(lang, e.devices.flatMap((d) => slugCandidates(e, d)))
    const link = (d: string) => slugCandidates(e, d).map((c) => hrefs[c]).find(Boolean)
    const others = all.filter((x) => x.slug !== e.slug && (x.vendor === e.vendor || x.os === e.os)).concat(all.filter((x) => x.vendor !== e.vendor && x.os !== e.os)).slice(0, 10)
    const url = `${SITE_URL}${sectionHref(lang, 'updates', e.slug)}`
    const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: fill(u.title, { os }), url, numberOfItems: e.devices.length,
      itemListElement: e.devices.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: d })) }
    return (
      <article className="max-w-4xl">
        <Breadcrumbs items={[{ name: t.ui.home, href: `/${lang}` }, section, { name: os, href: sectionHref(lang, 'updates', e.slug) }]} />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{fill(u.title, { os })}</h1>
        <p className="mt-3 text-lg text-muted">{e.summary}</p>
        <p className="mt-2 flex flex-wrap gap-2 text-sm">
          {e.released ? <span className="rounded-lg bg-surface px-2 py-1">{fill(u.released, { date: fmt(e.released) })}</span> : <span className="rounded-lg bg-surface px-2 py-1">{u.rolling}</span>}
          {e.announced && <span className="rounded-lg bg-surface px-2 py-1">{fill(u.announced, { date: fmt(e.announced) })}</span>}
        </p>
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">✅ {fill(u.devices, { n: e.devices.length })}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">{e.devices.map((d) => {
            const h = link(d)
            return <li key={d} className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
              <span>{d}</span>{h && <a href={h} className="shrink-0 text-sm text-accent hover:underline">{u.specs} →</a>}</li>
          })}</ul>
          <p className="mt-3 text-sm"><a href={e.source} target="_blank" rel="noopener nofollow" className="font-medium text-accent hover:underline">{u.source} ↗</a>
            {e.source2 && <> · <a href={e.source2} target="_blank" rel="noopener nofollow" className="text-accent hover:underline">{u.source2} ↗</a></>}</p>
        </section>
        {e.dropped.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">{u.dropped}</h2>
            <ul className="flex flex-wrap gap-2">{e.dropped.map((d) => <li key={d} className="rounded-lg bg-surface px-3 py-1.5 text-sm">{d}</li>)}</ul>
          </section>
        )}
        {e.highlights.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">{u.highlights}</h2>
            <ul className="list-disc space-y-1 ps-5">{e.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          </section>
        )}
        <p className="mt-8 rounded-xl bg-surface p-3 text-sm text-muted">{u.note}</p>
        <nav className="mt-10" aria-label={u.other}>
          <h2 className="mb-3 font-semibold">{u.other}</h2>
          <ul className="flex flex-wrap gap-2">{others.map((x) => <li key={x.slug}><a href={sectionHref(lang, 'updates', x.slug)} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 hover:border-accent hover:text-accent">{osName(x)}</a></li>)}</ul>
        </nav>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </article>
    )
  }

  if (key === 'reports' && slug.length <= 2) {
    if (slug.length === 1) permanentRedirect(sectionHref(lang, 'reports', REPORT_SLUG))
    if (slug[1] !== REPORT_SLUG) notFound()
    const r = reportText(lang)
    const now = await todayMs()
    const date = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(now))
    const cats = (await Promise.all(REPORT_CATS.map((k) => getCategoryByKey(lang, k)))).filter((c): c is NonNullable<typeof c> => !!c)
    const data = await Promise.all(cats.map(async (c) => ({ cat: c, trends: await getTrends(lang, c), top: (await getOverall(lang, c, 3)) })))
    const facts = data.flatMap(({ cat, trends }) => trends.slice(0, 1).map((tr) => {
      const a = tr.years[0], b = tr.years.at(-1)!
      const pct = Math.round(Math.abs((b.v - a.v) / a.v) * 100)
      return { cat, tr, pct, text: fill(b.v > a.v ? r.up : r.down, { category: cat.name, spec: tr.label, pct, y0: a.year, y1: b.year, d0: a.d, d1: b.d }), good: tr.hib ? b.v > a.v : b.v < a.v }
    })).filter((x) => x.pct >= 3).sort((x, y) => y.pct - x.pct)
    const support = brandSupport()
    const url = `${SITE_URL}${sectionHref(lang, 'reports', REPORT_SLUG)}`
    const ld = { '@context': 'https://schema.org', '@type': 'Dataset', name: r.title, description: r.lead, url, creator: { '@type': 'Organization', name: 'Specvane', url: SITE_URL },
      license: 'https://creativecommons.org/licenses/by/4.0/', dateModified: new Date(now).toISOString().slice(0, 10), inLanguage: lang }
    return (
      <article className="max-w-4xl">
        <Breadcrumbs items={[{ name: t.ui.home, href: `/${lang}` }, { name: r.section, href: sectionHref(lang, 'reports', REPORT_SLUG) }]} />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{r.title}</h1>
        <p className="mt-3 text-lg text-muted">{r.lead}</p>
        <p className="mt-1 text-sm text-muted">{fill(r.updated, { date })}</p>
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">{r.keyFacts}</h2>
          <ul className="space-y-2">{facts.map((f) => <li key={f.cat.key + f.tr.key} className="rounded-xl border border-border p-3"><span className={`me-2 inline-block rounded-md px-1.5 text-xs font-semibold ${f.good ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'}`}>{f.good ? r.better : r.worse}</span>{f.text}</li>)}</ul>
        </section>
        <section className="mt-10">
          <h2 className="mb-1 text-xl font-semibold">{r.byCategory}</h2>
          <p className="mb-4 text-sm text-muted">{r.chartNote}</p>
          {data.filter((x) => x.trends.length).map(({ cat, trends }) => (
            <div key={cat.key} className="mb-8">
              <h3 className="mb-2 font-semibold"><a href={`/${lang}/${cat.slug}`} className="hover:text-accent">{cat.name}</a></h3>
              <div className="grid gap-3 sm:grid-cols-2">{trends.map((tr) => {
                const max = Math.max(...tr.years.map((y) => y.v))
                return (
                  <figure key={tr.key} className="rounded-xl border border-border p-3">
                    <figcaption className="mb-2 text-sm font-medium">{tr.label}</figcaption>
                    <div className="flex h-28 items-end gap-1.5">{tr.years.map((y) => (
                      <div key={y.year} className="flex flex-1 flex-col items-center justify-end gap-1">
                        <span className="num text-[10px] text-muted">{y.d}</span>
                        <div className="w-full rounded-t bg-accent/70" style={{ height: `${Math.max(6, (y.v / max) * 80)}px` }} />
                        <span className="num text-[10px] text-muted">{y.year}</span>
                      </div>))}</div>
                    <a href={`/og/${lang}/trend/${cat.slug}/${tr.key}.png`} className="mt-2 inline-block text-xs text-accent hover:underline">{r.chartImage}</a>
                  </figure>
                )
              })}</div>
            </div>
          ))}
        </section>
        <section className="mt-10">
          <h2 className="mb-1 text-xl font-semibold">{r.updatesTitle}</h2>
          <p className="mb-3 text-sm text-muted">{r.updatesLead}</p>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface"><tr><th className="px-3 py-2 text-start">{r.brand}</th><th className="px-3 py-2 text-start">{r.security}</th><th className="px-3 py-2 text-start">{r.os}</th></tr></thead>
              <tbody>{support.map((b) => <tr key={b.brand} className="border-t border-border"><td className="px-3 py-2 font-medium">{b.brand}</td>
                <td className="num px-3 py-2">{b.sec ? fill(r.years, { n: b.sec }) : '—'}{!b.official && <span className="block text-xs text-muted">{r.unofficial}</span>}</td>
                <td className="num px-3 py-2">{b.os ? fill(r.years, { n: b.os }) : '—'}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold">{r.leaders}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.filter((x) => x.top.length).map(({ cat, top }) => (
            <div key={cat.key} className="rounded-xl border border-border p-3">
              <a href={sectionHref(lang, 'best', cat.slug)} className="font-semibold hover:text-accent">{cat.name}</a>
              <ol className="mt-1 list-decimal ps-5 text-sm">{top.map((p) => <li key={p.slug}><a href={p.href} className="hover:text-accent">{p.brand} {p.name}</a> <span className="num text-muted">· {p.score}</span></li>)}</ol>
            </div>))}</div>
        </section>
        <p className="mt-8 max-w-3xl text-sm text-muted">{r.method}</p>
        <section className="mt-8 rounded-2xl bg-surface p-4">
          <h2 className="mb-1 font-semibold">{r.cite}</h2>
          <p className="text-sm">{r.citeText}</p>
          <p className="mt-2 font-mono text-sm">{r.credit} — <a href={url} className="text-accent">{url}</a></p>
        </section>
        <p className="mt-4 max-w-3xl text-xs text-muted">{legalText(lang).rank}</p>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </article>
    )
  }

  if (key === 'widgets' && slug.length === 1) {
    const w = widgetsText(lang)
    const top = (await getTopComparisons(lang, 1))[0]
    const pair = top?.href.split('/').pop()
    return (
      <article className="max-w-3xl">
        <Breadcrumbs items={[{ name: t.ui.home, href: `/${lang}` }, { name: w.section, href: sectionHref(lang, 'widgets') }]} />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{w.pageTitle}</h1>
        <p className="mt-3 text-lg text-muted">{w.pageLead}</p>
        <h2 className="mb-2 mt-8 text-xl font-semibold">{w.how}</h2>
        <ol className="list-decimal space-y-1 ps-5">{w.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
        <h2 className="mb-2 mt-8 text-xl font-semibold">{w.formats}</h2>
        <p>{w.formatsText}</p>
        {pair && <>
          <h2 className="mb-2 mt-8 text-xl font-semibold">{w.example}</h2>
          <iframe src={`/embed/${lang}/compare/${pair}`} width="100%" height={420} loading="lazy" title={top.name} className="max-w-2xl rounded-xl border-0" />
          <p className="mt-2"><a href={top.href} className="text-accent hover:underline">{top.name} — Specvane</a></p>
          <ShareEmbed t={widgetsText(lang)} url={`${SITE_URL}${top.href}`} embed={`${SITE_URL}/embed/${lang}/compare/${pair}`} image={`${SITE_URL}/og/${lang}/compare/${pair}.png`} name={top.name} />
        </>}
        <h2 className="mb-2 mt-8 text-xl font-semibold">{w.rulesTitle}</h2>
        <ul className="list-disc space-y-1 ps-5">{w.rules.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </article>
    )
  }

  if (key === 'guides' && slug.length <= 2) {
    const g = GUIDE_UI[lang]
    const home = { name: t.ui.home, href: `/${lang}` }
    const section = { name: g.title, href: sectionHref(lang, 'guides') }
    if (slug.length === 1) {
      const list = await Promise.all(guides(lang).map(async (x) => ({ ...x, href: sectionHref(lang, 'guides', await guideSeg(lang, x.cat)) })))
      return (
        <>
          <Breadcrumbs items={[home, section]} />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{g.title}</h1>
          <p className="mt-2 max-w-2xl text-muted">{g.lead}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((x) => (
              <li key={x.cat}><a href={x.href} className="block h-full rounded-2xl border border-border p-4 hover:border-accent">
                <span className="font-semibold">{x.title}</span><span className="mt-1 block text-sm text-muted line-clamp-2">{x.lead}</span></a></li>
            ))}
          </ul>
        </>
      )
    }
    const gd = await guideBySeg(lang, slug[1])
    if (!gd) notFound()
    const cat = await getCategoryByKey(lang, gd.cat)
    const best = gd.specs.length ? (await getGlossaryLinks(lang, gd.specs.map((k) => ({ cat: gd.cat, key: k })))).filter((x) => x.href.includes(`/${SLUGS[lang].best}/`)) : []
    const terms = glossary(lang).filter((x) => gd.glossary.includes(x.slug))
    const tool = TOOLS.find((x) => x.cat === gd.cat)
    const more = [
      cat && { name: `${g.all}: ${cat.name}`, href: `/${lang}/${cat.slug}` },
      tool && { name: toolsText(lang)[tool.key].short, href: sectionHref(lang, 'tools', tool.id) },
      isAppliance(gd.cat) && { name: t.ui.errTitle, href: sectionHref(lang, 'errors') },
      ...(cat ? (await getUseCases(lang, cat)).filter((x) => x.items.length >= 5).slice(0, 4).map((x) => ({ name: ucItem(lang, x.uc.slug).title, href: sectionHref(lang, 'lists', cat.slug, x.uc.slug) })) : []),
    ].filter((x): x is { name: string; href: string } => !!x)
    const ld = [
      { '@context': 'https://schema.org', '@type': 'Article', headline: gd.title, description: gd.lead, inLanguage: lang, dateModified: '2026-11-11', publisher: { '@type': 'Organization', name: 'Specvane' } },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: gd.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ]
    return (
      <article className="max-w-3xl">
        <Breadcrumbs items={[home, section, { name: gd.title, href: sectionHref(lang, 'guides', slug[1]) }]} />
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{gd.title}</h1>
        <p className="mt-3 text-lg text-muted">{gd.lead}</p>
        {more.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{more.map((x) => <li key={x.href}><a href={x.href} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm font-medium hover:border-accent hover:text-accent">{x.name} →</a></li>)}</ul>}
        {gd.sections.map((sec, i) => (
          <section key={i} className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">{sec.h}</h2>
            <div className="space-y-4 leading-relaxed">{sec.p.map((p, j) => <p key={j}>{p}</p>)}</div>
          </section>
        ))}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-good-soft p-4">
            <h2 className="mb-2 font-semibold text-good">{g.checklist}</h2>
            <ul className="list-disc space-y-1 ps-5">{gd.checklist.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </section>
          <section className="rounded-2xl bg-bad-soft p-4">
            <h2 className="mb-2 font-semibold text-bad">{g.mistakes}</h2>
            <ul className="list-disc space-y-1 ps-5">{gd.mistakes.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </section>
        </div>
        {best.length > 0 && (
          <nav className="mt-8" aria-label={g.best}>
            <h2 className="mb-3 text-xl font-semibold">{g.best}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">{best.map((x) => <li key={x.href}><a href={x.href} className="flex min-h-11 items-center rounded-xl border border-border px-3 py-2 hover:border-accent hover:text-accent">{x.name} →</a></li>)}</ul>
          </nav>
        )}
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">{g.faq}</h2>
          <div className="space-y-2">{gd.faq.map((f, i) => (
            <details key={i} className="rounded-xl border border-border p-3" open={i === 0}>
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}</div>
        </section>
        {terms.length > 0 && (
          <nav className="mt-8" aria-label={g.terms}>
            <h2 className="mb-3 font-semibold">{g.terms}</h2>
            <ul className="flex flex-wrap gap-2">{terms.map((x) => <li key={x.slug}><a href={sectionHref(lang, 'glossary', x.slug)} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 hover:border-accent hover:text-accent">{x.term}</a></li>)}</ul>
          </nav>
        )}
        <p className="mt-8"><a href={sectionHref(lang, 'guides')} className="font-medium text-accent hover:underline">← {g.title}</a></p>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
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
        <section className={`mt-6 rounded-2xl border border-border p-4 md:p-6 ${tool.key === 'size' || tool.key === 'wall' || tool.key === 'fit' ? '' : 'max-w-3xl'}`}>
          {tool.key === 'size' || tool.key === 'wall'
            ? <RealSize t={tt} lang={lang} mode={tool.key} />
            : tool.key === 'fit' ? <FitFinder t={tt} lang={lang} imperialDefault={lang === 'en'} />
            : <ToolCalc tool={tool.key} t={tt} lang={lang} imperialDefault={lang === 'en'} {...defaultTariff(lang)} />}
        </section>
        {tool.key === 'ac' || tool.key === 'boiler'
          ? <p className="mt-4"><a href={sectionHref(lang, 'errors', cat?.slug ?? applianceName(lang, tool.cat as Appliance).slug)} className="font-medium text-accent hover:underline">{tx.cta} →</a></p>
          : cat && <p className="mt-4"><a href={`/${lang}/${cat.slug}`} className="font-medium text-accent hover:underline">{tx.cta}: {cat.name} →</a></p>}
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
    return (
      <>
        <ErrorsCode lang={lang} t={t} crumbs={[home, section, brandCrumb, { name: r.item.code, href: `${base}/${r.item.slug}` }]}
          title={title} item={r.item} others={r.others} base={base} models={models} catHref={ap.href} />
        <p className="mx-auto mt-8 max-w-3xl text-xs text-muted">{legalText(lang).errors}</p>
      </>
    )
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
                  <li><a href={sectionHref(lang, 'best', x!.cat.slug)} className="font-semibold text-accent hover:underline">{overallText(lang).short}</a></li>
                  {x!.specs.map((sp) => <li key={sp.slug}><a href={sectionHref(lang, 'best', x!.cat.slug, sp.slug)} className="text-accent hover:underline">{sp.label}</a></li>)}
                </ul>
              </section>
            ))}
          </div>
        </>
      )
    }
    if (slug.length === 2) {
      const c = await getCategory(lang, slug[1])
      if (!c) notFound()
      const top = await getOverall(lang, c)
      if (top.length < 5) notFound()
      const ot = overallText(lang)
      const title = fill(ot.title, { category: c.name, n: top.length })
      const specs = await getBestSpecs(lang, c)
      const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: title, itemListElement: top.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: `https://specvane.com${x.href}`, name: `${x.brand} ${x.name}` })) }
      return (
        <article>
          <Breadcrumbs items={[home, section, { name: c.name, href: `/${lang}/${c.slug}` }, { name: ot.short, href: sectionHref(lang, 'best', c.slug) }]} />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-muted">{fill(ot.lead, { category: c.name })}</p>
          <ol className="mt-6 space-y-3">
            {top.map((x, i) => (
              <li key={x.slug} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <span className="num w-8 shrink-0 text-center text-xl font-bold text-muted">{i + 1}</span>
                {x.image ? <img src={x.image} alt="" width={64} height={64} loading="lazy" className="h-16 w-16 shrink-0 rounded-xl bg-surface object-contain" /> : <span className="h-16 w-16 shrink-0 rounded-xl bg-surface" />}
                <div className="min-w-0 flex-1">
                  <a href={x.href} className="font-semibold hover:text-accent">{x.brand} {x.name}</a>
                  <p className="mt-1 hidden text-xs text-muted sm:block">{x.strengths.map((s2) => fill(ot.better, { spec: s2.label, p: s2.p })).join(' · ')}</p>
                  {x.strengths[0] && <p className="mt-1 text-xs text-muted sm:hidden">{fill(ot.better, { spec: x.strengths[0].label, p: x.strengths[0].p })}</p>}
                </div>
                <span className="shrink-0 text-end"><span className="num block text-2xl font-bold text-good">{x.score}</span><span className="text-xs text-muted">{ot.score}</span></span>
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-3xl text-sm text-muted">{ot.method}</p>
          <p className="mt-2 max-w-3xl text-xs text-muted">{legalText(lang).rank}</p>
          {specs.length > 0 && (
            <nav className="mt-8" aria-label={ot.bySpec}>
              <h2 className="mb-3 font-semibold">{ot.bySpec}</h2>
              <ul className="flex flex-wrap gap-2">{specs.map((sp) => <li key={sp.slug}><a href={sectionHref(lang, 'best', c.slug, sp.slug)} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 hover:border-accent hover:text-accent">{sp.label}</a></li>)}</ul>
            </nav>
          )}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        </article>
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
    const pair = c.canonical.split('/').pop()!
    return (
      <>
        <CompareView lang={lang} t={t} items={c.items} radar={radar}
          crumbs={[home, 'cross' in c ? { name: t.nav.compare, href: sectionHref(lang, 'compare') } : { name: c.cat.name, href: `/${lang}/${c.cat.slug}` }, { name: c.items.map((x) => x.name).join(` ${t.ui.vs} `), href: c.canonical }]} />
        {c.items.length === 2 && !('cross' in c) && pos.length === 2 && (() => {
          const groups = duelGroups(c.items[0].specGroups, [pos[0], pos[1]])
          return groups.length >= 2 && <Duel t={duelText(lang)} names={[`${c.items[0].brand} ${c.items[0].name}`, `${c.items[1].brand} ${c.items[1].name}`]} groups={groups} />
        })()}
        {c.items.length === 2 && 'cat' in c && ['smartphones', 'tablets', 'smartwatches'].includes(c.cat.key) && !('cross' in c) && (
          <p className="mx-auto mt-8 max-w-3xl"><a href={`${sectionHref(lang, 'tools', 'phone-size-comparison')}?cat=${c.cat.key}&a=${c.items[0].slug}&b=${c.items[1].slug}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 font-medium hover:border-accent hover:text-accent">📏 {toolsText(lang).size.short}: {c.items.map((x) => x.name).join(' vs ')} →</a></p>
        )}
        {c.items.length === 2 && <ShareEmbed t={widgetsText(lang)} url={`${SITE_URL}${c.canonical}`} embed={`${SITE_URL}/embed/${lang}/compare/${pair}`}
          image={`${SITE_URL}/og/${lang}/compare/${pair}.png`} name={c.items.map((x) => `${x.brand} ${x.name}`).join(' vs ')} />}
      </>
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
        if ((await getOverall(lang, cat)).length >= 5) tops.unshift({ label: overallText(lang).short, href: sectionHref(lang, 'best', cat.slug) })
        return <CategoryView lang={lang} t={t} title={cat.name} items={items} brands={brands} crumbs={[home, catCrumb]} tops={tops} trends={await getTrends(lang, cat)}
          browser={{ filters, compare: { cat: cat.key, base: sectionHref(lang, 'compare') } }}
          extra={[
            guideFor(lang, cat.key) && { label: GUIDE_UI[lang].one + ': ' + cat.name, href: sectionHref(lang, 'guides', cat.slug) },
            (await getCategoryBrands(cat)).length >= 2 && { label: brandsText(lang).section, href: sectionHref(lang, 'brands', cat.slug) },
            ((await getLists(lang, cat)).length > 0 || (await getUseCases(lang, cat)).some((x) => x.items.length >= 5)) && { label: listsText(lang).section, href: sectionHref(lang, 'lists', cat.slug) },
            hasErrors(lang) && applianceFor(cat.key) && { label: t.ui.errTitle, href: sectionHref(lang, 'errors', await guideSeg(lang, applianceFor(cat.key)!)) },
            TOOLS.find((x) => x.cat === cat.key) && { label: toolsText(lang)[TOOLS.find((x) => x.cat === cat.key)!.key].short, href: sectionHref(lang, 'tools', TOOLS.find((x) => x.cat === cat.key)!.id) },
          ].filter((x): x is { label: string; href: string } => !!x)} />
      }
      const p = await getProduct(lang, cat, slug[1])
      if (p) {
        const gb = (v: number | null) => (v == null ? '' : v >= 1024 ? `${number(lang, v / 1024)} TB` : `${number(lang, v)} GB`)
        const variants = [...new Set(p.variants.filter((v) => v.storage).sort((a, b) => (a.storage ?? 0) - (b.storage ?? 0))
          .map((v) => (v.ram ? `${gb(v.ram)} / ${gb(v.storage)}` : gb(v.storage))))]
        const year = (p.updatedAt ?? '').slice(0, 4) || '2026'
        const sup = cat.key === 'smartphones' || cat.key === 'tablets' ? supportFor(p.brand, p.name, p.releaseDate ?? null) : null
        const support = sup && { ...sup, now: await todayMs() }
        const compareLinks = await getCompareLinks(lang, p.slug)
        const faq = productFaq(lang, { brand: p.brand, name: p.name, releaseDate: p.releaseDate, keySpecs: p.keySpecs, specs: p.specGroups.flatMap((g) => g.specs) },
          { support, manual: p.docs.some((d) => d.kind === 'manual'), compare: compareLinks.map((c) => c.name ?? '').filter(Boolean) })
        return (
          <>
            <ProductView lang={lang} t={t} p={p} crumbs={[home, catCrumb, { name: `${p.brand} ${p.name}`, href: p.href }]}
              compareLinks={compareLinks} variants={variants} gallery={p.images} credits={p.credits}
              support={support}
              docs={p.docs} docsHref={p.docs.length ? `${p.href}/${MANUAL_SLUG[lang]}` : undefined}
              compare={{ cat: cat.key, base: sectionHref(lang, 'compare') }}
              positions={await getPositions(lang, cat, p.specGroups.flatMap((g) => g.specs))}
              cost={costInput(lang, cat.key, p.specGroups.flatMap((g) => g.specs))}
              better={await getBetterAlternatives(lang, cat, { slug: p.slug, release: p.releaseDate, keySpecs: p.keySpecs })}
              cross={await getCrossLinks(lang, cat, { slug: p.slug, brand: p.brand })}
              extra={hasErrors(lang) && applianceFor(cat.key) && errorCodes(lang, applianceFor(cat.key)!, slugify(p.brand)).length
                ? { title: t.ui.errTitle, links: [{ name: fill(t.ui.errBrandTitle, { brand: p.brand, appliance: applianceName(lang, applianceFor(cat.key)!).one }), href: sectionHref(lang, 'errors', await guideSeg(lang, applianceFor(cat.key)!), slugify(p.brand)) }] } : undefined}
              prevGen={await getPrevGeneration(lang, cat, p.brand, p.name).then((g) => g && { name: `${g.brand} ${g.name}`, href: g.href, specs: g.specGroups.flatMap((x) => x.specs) })}
              attribution={p.source === 'icecat' ? `Database Right data-sheet ${year} Icecat. All rights reserved. Data provided “as is” without warranty.` : undefined} />
            {(() => {
              const life = lifeFacts(lang, cat.key, p.specGroups.flatMap((g) => g.specs))
              const lt = lifeText(lang)
              return life.length > 0 && (
                <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-surface/50 p-5" aria-labelledby="life-h">
                  <h2 id="life-h" className="text-xl font-bold">💡 {lt.title}</h2>
                  <ul className="mt-3 space-y-2">{life.map((x, i) => <li key={i} className="flex gap-2"><span aria-hidden="true" className="text-accent">•</span><span>{x}</span></li>)}</ul>
                  <p className="mt-3 text-xs text-muted">{lt.note}</p>
                </section>
              )
            })()}
            {(cat.key === 'smartphones' || cat.key === 'tablets') && osForProduct(p.brand, p.name).length > 0 && (
              <p className="mx-auto mt-8 max-w-3xl text-sm"><span className="font-medium">📲 {osUi(lang).onProduct}:</span>{' '}
                {osForProduct(p.brand, p.name).map((x, i) => <span key={x.slug}>{i > 0 && ' · '}<a href={sectionHref(lang, 'updates', x.slug)} className="text-accent hover:underline">{osName(x)} ✓</a></span>)}</p>
            )}
            {(() => {
              const r = rightsFor(lang, cat.key)
              return r && (
                <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border p-5" aria-labelledby="rights-h">
                  <h2 id="rights-h" className="text-xl font-bold">🇪🇺 {r.t.title}</h2>
                  <p className="mt-1 text-sm text-muted">{r.t.lead}</p>
                  <ul className="mt-3 space-y-2">{r.items.map((x, i) => (
                    <li key={i} className="flex gap-2"><span aria-hidden="true" className="text-accent">•</span>
                      <span>{x.text} <a href={x.href} target="_blank" rel="noopener nofollow" className="whitespace-nowrap text-sm text-accent hover:underline">{r.t.source} ↗</a></span></li>
                  ))}</ul>
                  <p className="mt-3 text-xs text-muted">{r.t.note}</p>
                </section>
              )
            })()}
            <ProductJsonLd name={`${p.brand} ${p.name}`} brand={p.brand} image={p.images} url={p.href} />
            {['smartphones', 'tablets', 'smartwatches', 'tvs'].includes(cat.key) && (
              <p className="mx-auto mt-8 max-w-3xl"><a href={`${sectionHref(lang, 'tools', cat.key === 'tvs' ? 'tv-on-your-wall' : 'phone-size-comparison')}?cat=${cat.key}&a=${p.slug}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 font-medium hover:border-accent hover:text-accent">📏 {toolsText(lang)[cat.key === 'tvs' ? 'wall' : 'size'].short}: {p.brand} {p.name} →</a></p>
            )}
            {(cat.key === 'tvs' || cat.key === 'monitors') && (
              <p className="mx-auto mt-4 max-w-3xl"><a href={`${sectionHref(lang, 'tools', 'will-it-fit')}?cat=${cat.key}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 font-medium hover:border-accent hover:text-accent">📐 {toolsText(lang).fit.short} →</a></p>
            )}
            <ShareEmbed t={{ ...widgetsText(lang), title: widgetsText(lang).titleProduct }} url={`${SITE_URL}${p.href}`} embed={`${SITE_URL}/embed/${lang}/p/${cat.slug}/${p.slug}`}
              image={`${SITE_URL}/og/${lang}/p/${cat.slug}/${p.slug}.png`} name={`${p.brand} ${p.name}`} height={460} />
            {faq.length >= 3 && <ProductFaq title={fill(faqText(lang).title, { model: `${p.brand} ${p.name}` })} note={faqText(lang).note} items={faq} />}
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
function ProductFaq({ title, note, items }: { title: string; note: string; items: { q: string; a: string }[] }) {
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
  return (
    <section className="mx-auto mt-10 max-w-3xl" aria-labelledby="faq">
      <h2 id="faq" className="mb-3 text-xl font-semibold">{title}</h2>
      <div className="space-y-2">{items.map((f, i) => (
        <details key={i} className="rounded-xl border border-border p-3" open={i < 2}>
          <summary className="cursor-pointer font-medium">{f.q}</summary>
          <p className="mt-2 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}</div>
      <p className="mt-3 text-xs text-muted">{note}</p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </section>
  )
}

function ProductJsonLd({ name, brand, image, url }: { name: string; brand: string; image: string[]; url: string }) {
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name, brand: { '@type': 'Brand', name: brand }, image: image.slice(0, 3), url: `https://specvane.com${url}` }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
}
