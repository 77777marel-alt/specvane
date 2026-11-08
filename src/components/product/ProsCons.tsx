import type { Dict } from '@/lib/i18n'
import { IconCheck, IconMinus } from '../icons'

export function ProsCons({ t, pros, cons }: { t: Dict; pros: string[]; cons: string[] }) {
  const list = (items: string[], good: boolean) => (
    <ul className="space-y-2">
      {items.map((p) => (
        <li key={p} className="flex gap-2">
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${good ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'}`}>
            {good ? <IconCheck className="h-3.5 w-3.5" /> : <IconMinus className="h-3.5 w-3.5" />}
          </span>
          <span>{p}</span>
        </li>
      ))}
    </ul>
  )
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl border border-border p-4"><h2 className="mb-3 font-semibold">{t.ui.pros}</h2>{list(pros, true)}</section>
      <section className="rounded-2xl border border-border p-4"><h2 className="mb-3 font-semibold">{t.ui.cons}</h2>{list(cons, false)}</section>
    </div>
  )
}
