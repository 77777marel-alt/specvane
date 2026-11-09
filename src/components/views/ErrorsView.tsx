import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n'
import type { ProductCardData } from '@/lib/types'
import { fill } from '@/lib/format'
import { sectionHref } from '@/lib/routes'
import type { ErrorCode } from '@/lib/errors'
import { Breadcrumbs, type Crumb } from '../Breadcrumbs'
import { ProductCard } from '../product/ProductCard'

type Code = ErrorCode & { slug: string }

/** Индекс: техника × бренды. */
export function ErrorsIndex({ t, crumbs, groups }: { t: Dict; crumbs: Crumb[]; groups: { name: string; brands: { brand: string; href: string; n: number }[] }[] }) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t.ui.errTitle}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t.ui.errLead}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <section key={g.name} className="rounded-2xl border border-border p-4">
            <h2 className="mb-3 font-semibold">{g.name}</h2>
            <ul className="flex flex-wrap gap-2">
              {g.brands.map((b) => (
                <li key={b.href}><Link href={b.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 hover:border-accent hover:text-accent">
                  {b.brand} <span className="num text-xs text-muted">{b.n}</span></Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

/** Все коды бренда для одного вида техники. */
export function ErrorsBrand({ t, crumbs, title, codes, base }: { t: Dict; crumbs: Crumb[]; title: string; codes: Code[]; base: string }) {
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t.ui.errSafety}</p>
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border">
        {codes.map((c) => (
          <li key={c.slug}>
            <Link href={`${base}/${c.slug}`} className="flex min-h-14 items-center gap-4 px-4 py-3 hover:bg-surface">
              <span className="num w-24 shrink-0 font-mono text-lg font-bold text-accent">{c.code.length > 8 ? '—' : c.code}</span>
              <span className="flex-1">{c.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

/** Один код: что значит, причины, что сделать самому, когда звать мастера, источник. */
export function ErrorsCode({ lang, t, crumbs, title, item, others, base, models, catHref }:
  { lang: Locale; t: Dict; crumbs: Crumb[]; title: string; item: Code; others: Code[]; base: string; models: ProductCardData[]; catHref: string | null }) {
  const host = (() => { try { return new URL(item.source).hostname.replace(/^www\./, '') } catch { return item.source } })()
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-xl">{item.title}</p>
      {item.aliases.length > 0 && <p className="mt-1 text-sm text-muted">{item.aliases.join(' · ')}</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {item.causes.length > 0 && (
            <section className="rounded-2xl border border-border p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.ui.errCauses}</h2>
              <ul className="list-disc space-y-1 ps-5">{item.causes.map((c) => <li key={c}>{c}</li>)}</ul>
            </section>
          )}
          {item.steps.length > 0 && (
            <section className="rounded-2xl border border-border p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.ui.errSteps}</h2>
              <p className="mb-3 rounded-xl bg-surface p-3 text-sm">{t.ui.errSafety}</p>
              <ol className="list-decimal space-y-1.5 ps-5">{item.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </section>
          )}
          {item.technician && (
            <section className="rounded-2xl border border-border p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.ui.errTech}</h2>
              <p>{item.technician}</p>
            </section>
          )}
          <p className="text-xs text-muted">{fill(t.ui.errSource, { brand: item.brand })}: <a href={item.source} rel="nofollow noopener" target="_blank" className="underline hover:text-accent">{host}</a></p>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-border p-4">
            <h2 className="mb-2 font-semibold">{fill(t.ui.errOther, { brand: item.brand })}</h2>
            <ul className="space-y-1 text-sm">
              {others.slice(0, 14).map((o) => (
                <li key={o.slug}><Link href={`${base}/${o.slug}`} className="flex gap-2 hover:text-accent">
                  <span className="num w-14 shrink-0 font-mono font-semibold">{o.code.length > 8 ? '—' : o.code}</span><span className="line-clamp-1">{o.title}</span></Link></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {models.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold">{fill(t.ui.errModels, { brand: item.brand })}</h2>
            {catHref && <Link href={catHref} className="shrink-0 text-sm font-medium text-accent hover:underline">{t.ui.seeAll} →</Link>}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{models.map((p) => <ProductCard key={p.slug} lang={lang} p={p} />)}</div>
        </section>
      )}
    </>
  )
}

export const errorsBase = (lang: Locale, ...rest: string[]) => sectionHref(lang, 'errors', ...rest)
