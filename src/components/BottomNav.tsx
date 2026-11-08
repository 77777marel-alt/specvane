'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { IconGlobe, IconGrid, IconHome, IconSearch } from './icons'

type Item = { href: string; label: string; icon: 'home' | 'grid' | 'globe' }
const ICONS = { home: IconHome, grid: IconGrid, globe: IconGlobe }

/**
 * Нижнее меню на телефоне (правило Максима): 4–5 кнопок, центр — главное действие (поиск).
 * Прячется при прокрутке вниз, появляется при прокрутке вверх. Разделы «Сравнить» и «Лучшие»
 * добавятся сюда на этапе 1, когда у них будут страницы.
 */
export function BottomNav({ left, right, searchLabel }: { left: Item[]; right: Item[]; searchLabel: string }) {
  const path = usePathname()
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let y = window.scrollY
    const on = () => {
      const d = window.scrollY - y
      if (Math.abs(d) < 8) return
      setHidden(d > 0 && window.scrollY > 120)
      y = window.scrollY
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const link = (it: Item) => {
    const Icon = ICONS[it.icon]
    const current = it.href === path
    return (
      <a key={it.href} href={it.href} aria-current={current ? 'page' : undefined}
        className={`flex min-w-0 flex-col items-center justify-center gap-0.5 text-[10.5px] ${current ? 'font-semibold text-accent' : 'text-muted'}`}>
        <Icon className="h-[22px] w-[22px]" />
        <span className="max-w-full truncate px-1">{it.label}</span>
      </a>
    )
  }

  return (
    <nav aria-label="Menu"
      className={`fixed inset-x-0 bottom-0 z-40 grid h-16 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-300 md:hidden ${hidden ? 'translate-y-full' : ''}`}
      style={{ boxSizing: 'content-box', gridTemplateColumns: `repeat(${left.length + right.length + 1}, minmax(0, 1fr))` }}>
      {left.map(link)}
      <button type="button" aria-label={searchLabel} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); window.dispatchEvent(new Event('sv:search')) }}
        className="flex items-center justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-card"><IconSearch className="h-5 w-5" /></span>
      </button>
      {right.map(link)}
    </nav>
  )
}
