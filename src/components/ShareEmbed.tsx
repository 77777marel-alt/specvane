'use client'
import { useState } from 'react'

// Кнопка «Вставить на свой сайт»: готовый код для сайтов (iframe + ссылка), форумов (картинка, BBCode) и Markdown.
// Видимая ссылка на Specvane стоит в самом коде вставки — она и даёт обратную ссылку (iframe её не даёт).
export function ShareEmbed({ t, url, embed, image, name, height = 420 }: {
  t: { button: string; title: string; intro: string; html: string; image: string; bbcode: string; markdown: string; copy: string; copied: string; more: string }
  url: string; embed: string; image: string; name: string; height?: number; moreHref?: string
}) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const codes = [
    { k: 'html', label: t.html, code: `<iframe src="${embed}" width="100%" height="${height}" style="border:0;max-width:720px" loading="lazy" title="${name}"></iframe>\n<p><a href="${url}">${name} — Specvane</a></p>` },
    { k: 'image', label: t.image, code: `<a href="${url}"><img src="${image}" alt="${name}" width="600" loading="lazy"></a>` },
    { k: 'bbcode', label: t.bbcode, code: `[url=${url}][img]${image}[/img][/url]\n[url=${url}]${name} — Specvane[/url]` },
    { k: 'markdown', label: t.markdown, code: `[![${name}](${image})](${url})\n[${name} — Specvane](${url})` },
  ]
  const copy = async (k: string, code: string) => { try { await navigator.clipboard.writeText(code); setDone(k); setTimeout(() => setDone(null), 1500) } catch { /* без буфера обмена — код можно выделить вручную */ } }
  return (
    <section className="mx-auto mt-10 max-w-3xl">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 font-medium hover:border-accent hover:text-accent">
        <span aria-hidden="true">&lt;/&gt;</span> {t.button}
      </button>
      {open && (
        <div className="mt-3 rounded-2xl border border-border p-4">
          <h2 className="font-semibold">{t.title}</h2>
          <p className="mt-1 text-sm text-muted">{t.intro}</p>
          <div className="mt-3 space-y-3">
            {codes.map((c) => (
              <div key={c.k}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm"><span className="font-medium">{c.label}</span>
                  <button type="button" onClick={() => copy(c.k, c.code)} className="rounded-lg border border-border px-2.5 py-1 text-xs hover:border-accent">{done === c.k ? t.copied : t.copy}</button></div>
                <textarea readOnly value={c.code} rows={c.k === 'html' ? 3 : 2} onFocus={(e) => e.currentTarget.select()}
                  className="w-full resize-none rounded-lg border border-border bg-surface p-2 font-mono text-xs" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
