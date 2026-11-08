'use client'
import { useState } from 'react'

type Col = { name: string; brand: string; href: string }

/**
 * Сравнение 2–4 моделей: названия закреплены сверху, лучшее значение подсвечено,
 * переключатель «только различия». Строки строятся из групп характеристик первой модели.
 */
export function CompareTable({ cols, groups, labels }: {
  cols: Col[]
  /** groups[g].specs[i] — характеристика; значения по моделям в rows */
  groups: { name: string; rows: { key: string; label: string; higherIsBetter?: boolean | null; values: { display: string; value: number | boolean | string | null }[] }[] }[]
  labels: { onlyDiff: string; better: string }
}) {
  const [onlyDiff, setOnlyDiff] = useState(false)
  const best = (row: (typeof groups)[number]['rows'][number]) => {
    if (row.higherIsBetter == null) return -1
    const nums = row.values.map((v) => (typeof v.value === 'number' ? v.value : typeof v.value === 'boolean' ? Number(v.value) : NaN))
    if (nums.some(Number.isNaN) || new Set(row.values.map((v) => v.display)).size === 1) return -1
    const target = row.higherIsBetter ? Math.max(...nums) : Math.min(...nums)
    return nums.filter((n) => n === target).length === 1 ? nums.indexOf(target) : -1
  }
  const differs = (row: (typeof groups)[number]['rows'][number]) => new Set(row.values.map((v) => v.display)).size > 1
  const template = `minmax(8rem,1.1fr) repeat(${cols.length}, minmax(7.5rem,1fr))`
  return (
    <div>
      <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="peer sr-only" />
        <span className="relative h-6 w-10 rounded-full bg-surface-2 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-bg after:shadow after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-accent" />
        {labels.onlyDiff}
      </label>
      <div className="overflow-x-auto rounded-2xl border border-border" role="table">
        <div className="sticky top-0 z-10 grid border-b border-border bg-bg/95 backdrop-blur" style={{ gridTemplateColumns: template }} role="row">
          <div role="columnheader" />
          {cols.map((c) => (
            <div key={c.href} role="columnheader" className="px-3 py-3">
              <div className="text-xs text-muted">{c.brand}</div>
              <a href={c.href} className="font-semibold leading-tight hover:text-accent">{c.name}</a>
            </div>
          ))}
        </div>
        {groups.map((g) => {
          const rows = onlyDiff ? g.rows.filter(differs) : g.rows
          if (!rows.length) return null
          return (
            <div key={g.name} role="rowgroup">
              <div className="bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted" role="row">{g.name}</div>
              {rows.map((r) => {
                const b = best(r)
                return (
                  <div key={r.key} role="row" className="grid border-t border-border text-sm" style={{ gridTemplateColumns: template }}>
                    <div role="rowheader" className="px-3 py-2.5 text-muted">{r.label}</div>
                    {r.values.map((v, i) => (
                      <div key={i} role="cell" className={`num px-3 py-2.5 ${i === b ? 'bg-good-soft font-semibold text-good' : ''}`}>
                        {v.display}{i === b && <span className="sr-only"> ({labels.better})</span>}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
