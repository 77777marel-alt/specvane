/**
 * Радар сильных сторон двух моделей: по каждой оси — «лучше, чем у N% моделей категории» (0..100).
 * Чистый SVG; цвета — переменные темы (accent и тёплый второй цвет).
 */
export function Radar({ axes, series, title, note }: {
  axes: string[]
  series: { name: string; values: number[] }[]
  title: string; note: string
}) {
  if (axes.length < 3 || series.length < 2) return null
  const R = 110, C = 150, n = axes.length
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [C + Math.cos(a) * (R * v) / 100, C + Math.sin(a) * (R * v) / 100]
  }
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, Math.max(4, v)).join(',')).join(' ')
  const colors = ['var(--accent)', '#f59e0b', '#10b981', '#e11d48']
  return (
    <section aria-labelledby="radar" className="rounded-2xl border border-border p-4">
      <h2 id="radar" className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <div className="mt-3 grid items-center gap-4 md:grid-cols-[1fr_14rem]">
        <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-md" role="img" aria-label={title}>
          {[25, 50, 75, 100].map((r) => (
            <polygon key={r} points={axes.map((_, i) => pt(i, r).join(',')).join(' ')} fill="none" className="stroke-border" strokeWidth={1} />
          ))}
          {axes.map((a, i) => {
            const [x, y] = pt(i, 100), [lx, ly] = pt(i, 122)
            return (
              <g key={a}>
                <line x1={C} y1={C} x2={x} y2={y} className="stroke-border" strokeWidth={1} />
                <text x={lx} y={ly} textAnchor={Math.abs(lx - C) < 8 ? 'middle' : lx > C ? 'start' : 'end'} dominantBaseline="middle" className="fill-muted text-[9px]">{a}</text>
              </g>
            )
          })}
          {series.map((s, k) => (
            <polygon key={s.name} points={poly(s.values)} fill={colors[k]} fillOpacity={0.18} stroke={colors[k]} strokeWidth={2} />
          ))}
        </svg>
        <ul className="space-y-2 text-sm">
          {series.map((s, k) => (
            <li key={s.name} className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colors[k] }} />{s.name}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
