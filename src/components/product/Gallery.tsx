'use client'
import { useState } from 'react'
import { ProductImage } from './ProductImage'

/** Галерея товара: большое фото + миниатюры; нажатие на миниатюру меняет фото. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0)
  const list = images.slice(0, 6)
  return (
    <div>
      <ProductImage src={list[i] ?? null} alt={alt} />
      {list.length > 1 && (
        <ul className="mt-2 grid grid-cols-6 gap-2">
          {list.map((g, k) => (
            <li key={g}>
              <button type="button" onClick={() => setI(k)} aria-label={`${alt} — ${k + 1}`} aria-pressed={k === i}
                className="block w-full rounded-2xl outline-offset-2 ring-accent transition aria-pressed:ring-2 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-accent">
                <ProductImage src={g} alt="" ratio="aspect-square" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
