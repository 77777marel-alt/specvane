'use client'
import { useSyncExternalStore } from 'react'
import { compareStore } from '@/lib/compare-store'

type Strings = { compareNow: string; pickOneMore: string; clearAll: string; remove: string; vs: string }

/** Панель сравнения внизу экрана: 1–2 выбранные модели и кнопка «Сравнить». Над нижним меню на телефоне. */
export function CompareTray({ s }: { s: Strings }) {
  const items = useSyncExternalStore(compareStore.subscribe, compareStore.get, compareStore.getServer)
  if (!items.length) return null
  const ready = items.length === 2
  const href = ready ? `${items[0].base}/${items[0].slug}-vs-${items[1].slug}` : undefined
  return (
    <div className="fixed inset-x-0 bottom-[4.5rem] z-40 px-3 md:bottom-4" role="region" aria-label={s.compareNow}>
      <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-border bg-bg/95 p-2 shadow-card backdrop-blur">
        <ul className="flex min-w-0 flex-1 items-center gap-2">
          {items.map((it, i) => (
            <li key={it.slug} className="flex min-w-0 flex-1 items-center gap-2">
              {i === 1 && <span className="text-xs text-muted">{s.vs}</span>}
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface px-2 py-1.5">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- миниатюра с CDN Icecat
                  <img src={it.image} alt="" className="h-8 w-8 shrink-0 object-contain mix-blend-multiply dark:mix-blend-normal" referrerPolicy="no-referrer" />
                ) : <span className="h-8 w-8 shrink-0 rounded-lg bg-surface-2" />}
                <span className="truncate text-sm font-medium">{it.name}</span>
                <button type="button" onClick={() => compareStore.remove(it.slug)} aria-label={`${s.remove}: ${it.name}`}
                  className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-fg">×</button>
              </div>
            </li>
          ))}
          {!ready && <li className="hidden flex-1 text-sm text-muted sm:block">{s.pickOneMore}</li>}
        </ul>
        {ready ? (
          <a href={href} className="flex h-11 shrink-0 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90">{s.compareNow}</a>
        ) : (
          <button type="button" onClick={() => compareStore.clear()} className="h-11 shrink-0 rounded-xl border border-border px-3 text-sm text-muted hover:text-fg">{s.clearAll}</button>
        )}
      </div>
    </div>
  )
}
