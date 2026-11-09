'use client'
import { useRef, useState } from 'react'
import { IconChevron, IconImage } from '../icons'

/**
 * Галерея товара по кругу: стрелки, нажатие на фото, свайп на телефоне, стрелки клавиатуры.
 * Фото, которое не загрузилось, убираем из круга — пустого экрана не бывает.
 */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [broken, setBroken] = useState<string[]>([])
  const list = images.slice(0, 8).filter((u) => !broken.includes(u))
  const [i, setI] = useState(0)
  const n = list.length
  const cur = n ? ((i % n) + n) % n : 0
  const go = (d: number) => n > 1 && setI(cur + d)
  const touchX = useRef<number | null>(null)

  return (
    <div>
      <div
        className="group relative flex aspect-[4/3] select-none items-center justify-center overflow-hidden rounded-2xl bg-surface"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
        }}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }}
        tabIndex={n > 1 ? 0 : -1}
        role={n > 1 ? 'region' : undefined}
        aria-roledescription={n > 1 ? 'carousel' : undefined}
        aria-label={alt}
      >
        {n ? (
          // eslint-disable-next-line @next/next/no-img-element -- фото с CDN Icecat
          <img
            key={list[cur]} src={list[cur]} alt={`${alt}${n > 1 ? ` — ${cur + 1}/${n}` : ''}`}
            onClick={() => go(1)} onError={() => setBroken((b) => [...b, list[cur]])}
            className={`h-full w-full object-contain p-3 mix-blend-multiply dark:mix-blend-normal ${n > 1 ? 'cursor-pointer' : ''}`}
            decoding="async" referrerPolicy="no-referrer" draggable={false}
          />
        ) : (
          <IconImage className="h-1/3 w-1/3 text-muted/40" />
        )}
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="←"
              className="absolute start-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg/90 shadow-card transition hover:border-accent md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
              <IconChevron className="h-5 w-5 rotate-180" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="→"
              className="absolute end-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg/90 shadow-card transition hover:border-accent md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100">
              <IconChevron className="h-5 w-5" />
            </button>
            <div className="num absolute bottom-2 end-3 rounded-full bg-bg/80 px-2 py-0.5 text-xs text-muted">{cur + 1} / {n}</div>
          </>
        )}
      </div>
      {n > 1 && (
        <ul className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {list.map((g, k) => (
            <li key={g} className="w-16 shrink-0 md:w-20">
              <button type="button" onClick={() => setI(k)} aria-label={`${alt} — ${k + 1}`} aria-pressed={k === cur}
                className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-transparent bg-surface transition hover:opacity-80 aria-pressed:border-accent">
                {/* eslint-disable-next-line @next/next/no-img-element -- миниатюра */}
                <img src={g} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
                  onError={() => setBroken((b) => [...b, g])} className="h-full w-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
