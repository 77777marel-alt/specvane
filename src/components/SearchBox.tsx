'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { IconSearch } from './icons'

type Hit = { name: string; brand: string; href: string; category: string }

/**
 * Поиск с подсказками по моделям и брендам. Запрашивает /api/search (Postgres pg_trgm),
 * открывается также по событию 'sv:search' (кнопка в нижнем меню телефона).
 */
export function SearchBox({ lang, placeholder, label, empty, variant = 'header' }:
  { lang: string; placeholder: string; label: string; empty: string; variant?: 'header' | 'hero' }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()

  useEffect(() => {
    if (variant !== 'header') return
    const onOpen = () => { input.current?.focus(); input.current?.scrollIntoView({ block: 'center' }) }
    window.addEventListener('sv:search', onOpen)
    return () => window.removeEventListener('sv:search', onOpen)
  }, [variant])

  useEffect(() => {
    if (q.trim().length < 2) return
    const ctl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/search?lang=${lang}&q=${encodeURIComponent(q.trim())}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : { hits: [] }))
        .then((d: { hits: Hit[] }) => { setHits(d.hits); setActive(-1) })
        .catch(() => {})
    }, 180)
    return () => { clearTimeout(t); ctl.abort() }
  }, [q, lang])

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)) }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); window.location.href = hits[active].href }
    else if (e.key === 'Escape') setOpen(false)
  }

  const big = variant === 'hero'
  return (
    <div className="relative w-full" role="search">
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className={`flex items-center gap-2 rounded-xl border border-border bg-bg focus-within:border-accent ${big ? 'h-14 px-4 shadow-card' : 'h-10 px-3'}`}>
        <IconSearch className={big ? 'h-5 w-5 text-muted' : 'h-4 w-4 text-muted'} />
        <input id={id} ref={input} type="search" value={q} placeholder={placeholder} autoComplete="off"
          role="combobox" aria-expanded={open && q.length >= 2} aria-controls={`${id}-list`} aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={onKey}
          className={`w-full bg-transparent outline-none placeholder:text-muted ${big ? 'text-lg' : 'text-sm'}`} />
      </div>
      {open && q.trim().length >= 2 && (
        <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-bg shadow-card">
          {hits.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">{empty}</li>
          ) : hits.map((h, i) => (
            <li key={h.href} id={`${id}-${i}`} role="option" aria-selected={i === active}>
              <a href={h.href} className={`flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm hover:bg-surface ${i === active ? 'bg-surface' : ''}`}>
                <span><span className="text-muted">{h.brand}</span> <span className="font-medium">{h.name}</span></span>
                <span className="shrink-0 text-xs text-muted">{h.category}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
