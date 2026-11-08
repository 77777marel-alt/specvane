import Link from 'next/link'
import { SITE_URL } from '@/lib/site'
import { IconChevron } from './icons'

export type Crumb = { name: string; href: string }

/** Хлебные крошки + разметка BreadcrumbList. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const ld = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: SITE_URL + c.href })),
  }
  return (
    <nav aria-label="Breadcrumb" className="py-4 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            {i > 0 && <IconChevron className="h-3.5 w-3.5 opacity-60" />}
            {i === items.length - 1 ? <span aria-current="page" className="text-fg">{c.name}</span>
              : <Link href={c.href} className="hover:text-fg">{c.name}</Link>}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </nav>
  )
}
