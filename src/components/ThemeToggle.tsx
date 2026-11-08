'use client'
import { useSyncExternalStore } from 'react'
import { IconMoon, IconSun } from './icons'

type Mode = 'light' | 'dark' | 'system'
import { THEME_KEY as KEY } from './theme-script'

// Тема хранится в атрибуте <html data-theme>; подписка на его изменения.
const read = (): Mode => {
  const t = document.documentElement.dataset.theme
  return t === 'light' || t === 'dark' ? t : 'system'
}
const subscribe = (cb: () => void) => {
  const o = new MutationObserver(cb)
  o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => o.disconnect()
}

export function ThemeToggle({ labels }: { labels: { theme: string; light: string; dark: string; system: string } }) {
  const mode = useSyncExternalStore(subscribe, read, () => 'system' as Mode)
  const next: Record<Mode, Mode> = { system: 'light', light: 'dark', dark: 'system' }
  function cycle() {
    const m = next[mode]
    try {
      if (m === 'system') { localStorage.removeItem(KEY); delete document.documentElement.dataset.theme }
      else { localStorage.setItem(KEY, m); document.documentElement.dataset.theme = m }
    } catch {}
  }
  const label = { light: labels.light, dark: labels.dark, system: labels.system }[mode]
  return (
    <button type="button" onClick={cycle} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm text-muted hover:text-fg"
      aria-label={`${labels.theme}: ${label}`} title={`${labels.theme}: ${label}`}>
      {mode === 'dark' ? <IconMoon className="h-4 w-4" /> : <IconSun className="h-4 w-4" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
