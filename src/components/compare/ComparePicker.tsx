'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { compareStore } from '@/lib/compare-store'
import { IconSearch } from '../icons'

type Hit = { name: string; brand: string; slug: string; cat: string; category: string }
type Strings = { searchPlaceholder: string; noResults: string; pickOneMore: string; addCompare: string; inCompare: string }

/** «Собери своё сравнение»: поиск модели → в сравнение (вторая — только из той же категории). */
export function ComparePicker({ lang, base, s }: { lang: string; base: string; s: Strings }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const picked = useSyncExternalStore(compareStore.subscribe, compareStore.get, compareStore.getServer)
  const cat = picked.length === 1 ? picked[0].cat : null

  useEffect(() => {
    if (q.trim().length < 2) return
    const ctl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/search?lang=${lang}&q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => r.json()).then((d) => setHits(d.hits ?? [])).catch(() => {})
    }, 200)
    return () => { clearTimeout(t); ctl.abort() }
  }, [q, lang])

  const list = q.trim().length < 2 ? [] : hits.filter((h) => !cat || h.cat === cat)
  return (
    <div className="rounded-2xl border border-border p-4">
      <label className="flex h-12 items-center gap-2 rounded-xl border border-border px-3 focus-within:border-accent">
        <IconSearch className="h-5 w-5 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={cat ? s.pickOneMore : s.searchPlaceholder}
          className="h-full flex-1 bg-transparent outline-none" aria-label={s.searchPlaceholder} />
      </label>
      {list.length > 0 && (
        <ul className="mt-2 divide-y divide-border">
          {list.map((h) => {
            const on = picked.some((x) => x.slug === h.slug)
            return (
              <li key={h.slug} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{h.brand} {h.name}</div>
                  <div className="text-xs text-muted">{h.category}</div>
                </div>
                <button type="button" aria-pressed={on}
                  onClick={() => { compareStore.toggle({ slug: h.slug, name: `${h.brand} ${h.name}`, brand: h.brand, image: null, cat: h.cat, base }); setQ('') }}
                  className={`h-9 shrink-0 rounded-lg border px-3 text-sm font-medium ${on ? 'border-accent bg-accent-soft text-accent' : 'border-border hover:border-accent'}`}>
                  {on ? s.inCompare : s.addCompare}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {q.trim().length >= 2 && list.length === 0 && <p className="mt-3 text-sm text-muted">{s.noResults}</p>}
    </div>
  )
}
