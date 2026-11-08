import type { SpecValue } from '@/lib/types'

/** 3–5 главных характеристик крупными цифрами. */
export function KeySpecs({ specs, title }: { specs: SpecValue[]; title: string }) {
  return (
    <section aria-label={title}>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {specs.slice(0, 6).map((s) => (
          <div key={s.key} className="rounded-xl border border-border px-3 py-2.5">
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="num mt-0.5 text-lg font-semibold leading-tight">{s.display}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
