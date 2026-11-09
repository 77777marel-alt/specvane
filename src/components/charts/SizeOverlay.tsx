/** Контуры двух моделей в одном масштабе (ширина × высота, мм), наложенные друг на друга. Чистый SVG. */
export function SizeOverlay({ items, title, note }: { items: { name: string; w: number; h: number }[]; title: string; note: string }) {
  const W = Math.max(...items.map((x) => x.w)), H = Math.max(...items.map((x) => x.h))
  const pad = 12, scale = 260 / Math.max(W, H)
  const colors = ['var(--accent)', '#f59e0b']
  const vw = W * scale + pad * 2, vh = H * scale + pad * 2
  return (
    <section aria-labelledby="size" className="rounded-2xl border border-border p-4">
      <h2 id="size" className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{note}</p>
      <div className="mt-3 grid items-center gap-4 sm:grid-cols-[auto_1fr]">
        <svg viewBox={`0 0 ${vw} ${vh}`} className="mx-auto h-72 max-w-full" role="img" aria-label={title}>
          {items.map((x, k) => {
            const w = x.w * scale, h = x.h * scale, r = Math.min(w, h) * 0.08
            return <rect key={x.name} x={pad + (W * scale - w) / 2} y={pad + (H * scale - h)} width={w} height={h} rx={r}
              fill={colors[k]} fillOpacity={0.12} stroke={colors[k]} strokeWidth={2} strokeDasharray={k ? '6 4' : undefined} />
          })}
        </svg>
        <ul className="space-y-2 text-sm">
          {items.map((x, k) => (
            <li key={x.name} className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colors[k] }} />
              <span>{x.name}</span><span className="num ms-auto text-muted">{Math.round(x.w)} × {Math.round(x.h)} mm</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
