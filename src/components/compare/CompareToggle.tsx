'use client'
import { useSyncExternalStore } from 'react'
import { compareStore, type CompareItem } from '@/lib/compare-store'
import { IconCheck, IconCompare } from '../icons'

/** Кнопка «Сравнить» на карточке и на странице модели. */
export function CompareToggle({ item, label, active, variant = 'chip' }: { item: CompareItem; label: string; active: string; variant?: 'chip' | 'button' }) {
  const on = useSyncExternalStore(compareStore.subscribe, () => compareStore.get().some((x) => x.slug === item.slug), () => false)
  const base = variant === 'button'
    ? 'inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold'
    : 'inline-flex h-8 items-center gap-1.5 rounded-full border bg-bg/95 px-3 text-xs font-medium shadow-sm backdrop-blur'
  return (
    <button type="button" aria-pressed={on} aria-label={on ? active : label} title={on ? active : label} onClick={(e) => { e.preventDefault(); e.stopPropagation(); compareStore.toggle(item) }}
      className={`${base} transition ${on ? 'border-accent bg-accent-soft text-accent' : 'border-border hover:border-accent hover:text-accent'}`}>
      {on ? <IconCheck className="h-4 w-4" /> : <IconCompare className="h-4 w-4" />}
      {variant === 'chip' ? <span className="hidden sm:inline">{on ? active : label}</span> : on ? active : label}
    </button>
  )
}
