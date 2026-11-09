type Trend = { key: string; label: string; hib: boolean; years: { year: number; n: number; v: number; d: string }[] }

/** «Как менялись характеристики по годам»: маленькие столбики медианы по годам + изменение в процентах. */
export function Trends({ trends, title, note }: { trends: Trend[]; title: string; note: string }) {
  if (!trends.length) return null
  return (
    <section aria-labelledby="trends" className="mt-10 rounded-2xl border border-border p-4">
      <h2 id="trends" className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {trends.map((t) => {
          const max = Math.max(...t.years.map((y) => y.v))
          const first = t.years[0], last = t.years.at(-1)!
          const pct = Math.round(((last.v - first.v) / first.v) * 100)
          const good = t.hib ? pct > 0 : pct < 0
          return (
            <figure key={t.key} className="rounded-xl bg-surface p-3">
              <figcaption className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{t.label}</span>
                {pct !== 0 && (
                  <span className={`num shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${good ? 'bg-good-soft text-good' : 'bg-surface-2 text-muted'}`}>
                    {pct > 0 ? '+' : '−'}{Math.abs(pct)}% · {first.year}→{last.year}
                  </span>
                )}
              </figcaption>
              <ol className="mt-3 flex h-28 items-end gap-1.5" aria-label={t.label}>
                {t.years.map((y, i) => (
                  <li key={y.year} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    <span className="num max-w-full truncate text-[10px] text-muted">{y.d}</span>
                    <span className={`w-full rounded-t-md ${i === t.years.length - 1 ? 'bg-accent' : 'bg-accent/35'}`}
                      style={{ height: `${Math.max(6, (y.v / max) * 70)}%` }} title={`${y.year}: ${y.d} (${y.n})`} />
                    <span className="num text-[11px] text-muted">{String(y.year).slice(2).padStart(3, '’')}</span>
                  </li>
                ))}
              </ol>
            </figure>
          )
        })}
      </div>
    </section>
  )
}
