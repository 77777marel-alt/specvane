'use client'
import { useState } from 'react'

type S = { weightsTitle: string; weightsNote: string; weightOff: string; weightLow: string; weightMid: string; weightHigh: string; yourScore: string }

/**
 * Своя оценка: посетитель задаёт важность каждой характеристики (0–3), оценка пересчитывается сразу.
 * Формула открыта: взвешенное среднее мест модели в категории (0–100).
 */
export function WeightScore({ axes, series, s }: { axes: string[]; series: { name: string; values: number[] }[]; s: S }) {
  const [w, setW] = useState<number[]>(() => axes.map(() => 2))
  const levels = [s.weightOff, s.weightLow, s.weightMid, s.weightHigh]
  const sum = w.reduce((a, b) => a + b, 0)
  const score = (vals: number[]) => (sum ? Math.round(vals.reduce((a, v, i) => a + v * w[i], 0) / sum) : 0)
  const scores = series.map((x) => score(x.values))
  const best = Math.max(...scores)
  return (
    <section aria-labelledby="weights" className="rounded-2xl border border-border p-4">
      <h2 id="weights" className="text-xl font-semibold">{s.weightsTitle}</h2>
      <p className="mt-1 text-sm text-muted">{s.weightsNote}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {series.map((x, k) => (
          <div key={x.name} className={`rounded-xl p-3 ${scores[k] === best && scores.filter((v) => v === best).length === 1 ? 'bg-good-soft' : 'bg-surface'}`}>
            <div className="text-xs text-muted">{s.yourScore}</div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-medium">{x.name}</span>
              <span className="num text-3xl font-bold">{scores[k]}</span>
            </div>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-2">
        {axes.map((a, i) => (
          <li key={a} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{a}</span>
            <span className="flex gap-1" role="group" aria-label={a}>
              {levels.map((l, v) => (
                <button key={l} type="button" aria-pressed={w[i] === v} onClick={() => setW(w.map((x, j) => (j === i ? v : x)))}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${w[i] === v ? 'border-accent bg-accent-soft text-accent' : 'border-border hover:border-accent'}`}>{l}</button>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
