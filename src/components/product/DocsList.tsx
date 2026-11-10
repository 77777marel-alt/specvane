import type { Dict } from '@/lib/i18n'

const LABEL = (t: Dict, kind: string) =>
  kind === 'manual' ? t.ui.docManual : kind === 'energy_label' ? t.ui.docLabel : kind === 'product_fiche' ? t.ui.docFiche : t.ui.docBrochure

/** Официальные документы модели: инструкция, этикетка ЕС, информационный лист, брошюра (PDF в новой вкладке). */
export function DocsList({ t, docs, big }: { t: Dict; docs: { kind: string; url: string }[]; big?: boolean }) {
  return (
    <ul className={big ? 'grid gap-3 sm:grid-cols-2' : 'space-y-2 text-sm'}>
      {docs.map((d) => (
        <li key={d.url}>
          <a href={d.url} target="_blank" rel="nofollow noopener"
            className={`flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 font-medium hover:border-accent hover:text-accent ${big ? 'min-h-16 text-base' : 'min-h-11'}`}>
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">{/\.png|\.jpe?g/i.test(d.url) ? 'IMG' : 'PDF'}</span>
              {LABEL(t, d.kind)}
            </span>
            <span aria-hidden="true" className="text-muted">↗</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
