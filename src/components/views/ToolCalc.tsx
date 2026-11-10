'use client'
import { useState } from 'react'
import type { ToolsText, ToolKey } from '@/lib/tools'

// Калькуляторы: всё считается в браузере, мгновенно. Единицы: метрические по умолчанию, дюймы/футы — переключателем.
const SIZES = [32, 40, 43, 50, 55, 58, 65, 70, 75, 77, 83, 85, 98, 100]
const num = (s: string) => { const v = Number(String(s).replace(',', '.')); return Number.isFinite(v) && v > 0 ? v : null }

function Field({ label, value, onChange, unit, step = 'any' }: { label: string; value: string; onChange: (v: string) => void; unit?: string; step?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <input inputMode="decimal" type="number" step={step} min="0" value={value} onChange={(e) => onChange(e.target.value)}
          className="num h-12 w-full rounded-xl border border-border bg-bg px-3 text-lg" />
        {unit && <span className="shrink-0 text-sm text-muted">{unit}</span>}
      </span>
    </label>
  )
}

function Out({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className={`num font-bold ${big ? 'text-3xl' : 'text-xl'}`}>{value}</div>
    </div>
  )
}

export function ToolCalc({ tool, t, lang, imperialDefault }: { tool: ToolKey; t: ToolsText; lang: string; imperialDefault: boolean }) {
  const [imp, setImp] = useState(imperialDefault)
  const f = (n: number, d = 1) => new Intl.NumberFormat(lang, { maximumFractionDigits: d }).format(n)
  const len = (m: number) => (imp ? `${f(m * 3.28084)} ft` : `${f(m, 2)} m`)
  // --- размер телевизора: диагональ = расстояние / 1,6 (угол 30°) … расстояние / 1,2 (угол 40°)
  const [dist, setDist] = useState(imperialDefault ? '8' : '2.5')
  const toggle = (
    <div className="mb-4 inline-flex rounded-xl border border-border p-1 text-sm" role="group">
      {[false, true].map((v) => (
        <button key={String(v)} type="button" aria-pressed={imp === v} onClick={() => { if (v !== imp) { const d = num(dist); if (d) setDist(String(Math.round((v ? d * 3.28084 : d / 3.28084) * 10) / 10)) } setImp(v) }}
          className={`rounded-lg px-3 py-1.5 ${imp === v ? 'bg-accent text-accent-fg' : 'text-muted'}`}>{v ? t.imperial : t.metric}</button>
      ))}
    </div>
  )

  // --- проектор
  const [ratio, setRatio] = useState('1.5'), [pdiag, setPdiag] = useState('100'), [aspect, setAspect] = useState('16:9')
  // --- PPI
  const [pw, setPw] = useState('2560'), [ph, setPh] = useState('1440'), [sd, setSd] = useState('27')
  // --- пауэрбанк
  const [mah, setMah] = useState('20000'), [volt, setVolt] = useState('3.7')

  if (tool === 'tv') {
    const d = num(dist)
    const inches = d ? (imp ? d * 12 : d * 39.3701) : null // расстояние в дюймах (ввод: футы или метры)
    const lo = inches ? inches / 1.6 : null, hi = inches ? inches / 1.2 : null
    const sizes = lo && hi ? SIZES.filter((s) => s >= lo - 2 && s <= hi + 2) : []
    return (
      <div>
        {toggle}
        <Field label={t.tv.distance} value={dist} onChange={setDist} unit={imp ? 'ft' : 'm'} />
        {lo && hi && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Out big label={t.tv.range} value={`${f(lo, 0)}–${f(hi, 0)}″`} />
            <Out label={t.tv.sizes} value={sizes.length ? sizes.map((s) => `${s}″`).join(' · ') : '—'} />
          </div>
        )}
        <p className="mt-3 text-sm text-muted">{t.tv.note}</p>
      </div>
    )
  }

  if (tool === 'projector') {
    const r = num(ratio), dg = num(pdiag)
    const [aw, ah] = aspect.split(':').map(Number)
    const diagM = dg ? dg * 0.0254 : null // диагональ вводится в дюймах
    const width = diagM ? diagM * aw / Math.hypot(aw, ah) : null, height = width ? width * ah / aw : null
    return (
      <div>
        {toggle}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t.projector.ratio} value={ratio} onChange={setRatio} unit=": 1" />
          <Field label={t.projector.diagonal} value={pdiag} onChange={setPdiag} unit="″" />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t.projector.aspect}</span>
            <select value={aspect} onChange={(e) => setAspect(e.target.value)} className="h-12 w-full rounded-xl border border-border bg-bg px-3 text-lg">
              {['16:9', '16:10', '4:3', '21:9'].map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
        </div>
        {r && width && height && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Out big label={t.projector.distance} value={len(r * width)} />
            <Out label={t.projector.width} value={len(width)} />
            <Out label={t.projector.height} value={len(height)} />
          </div>
        )}
        <p className="mt-3 text-sm text-muted">{t.projector.note}</p>
      </div>
    )
  }

  if (tool === 'ppi') {
    const w = num(pw), h = num(ph), dg = num(sd)
    const ppi = w && h && dg ? Math.hypot(w, h) / dg : null
    const retinaIn = ppi ? 3438 / ppi : null // 1 угловая минута
    return (
      <div>
        {toggle}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t.ppi.width} value={pw} onChange={setPw} step="1" />
          <Field label={t.ppi.height} value={ph} onChange={setPh} step="1" />
          <Field label={t.ppi.diagonal} value={sd} onChange={setSd} unit="″" />
        </div>
        {ppi && retinaIn && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Out big label={t.ppi.density} value={`${f(ppi, 0)} PPI`} />
            <Out label={t.ppi.pitch} value={`${f(25.4 / ppi, 3)} mm`} />
            <Out label={t.ppi.retina} value={imp ? `${f(retinaIn, 0)} in` : `${f(retinaIn * 2.54, 0)} cm`} />
          </div>
        )}
        <p className="mt-3 text-sm text-muted">{t.ppi.note}</p>
      </div>
    )
  }

  // пауэрбанк: Вт·ч = мА·ч × В / 1000; правила IATA: ≤100 — можно в ручную кладь, 101–160 — с разрешения, >160 — нельзя
  const c = num(mah), v = num(volt)
  const wh = c && v ? (c * v) / 1000 : null
  const level = wh == null ? null : wh <= 100 ? 'ok' : wh <= 160 ? 'approval' : 'forbidden'
  const color = level === 'ok' ? 'bg-good-soft text-good' : level === 'approval' ? 'bg-surface-2' : 'bg-bad-soft text-bad'
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.powerbank.capacity} value={mah} onChange={setMah} unit="mAh" step="1" />
        <Field label={t.powerbank.voltage} value={volt} onChange={setVolt} unit="V" />
      </div>
      {wh != null && level && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr]">
          <Out big label={t.powerbank.energy} value={`${f(wh, 1)} Wh`} />
          <p className={`rounded-xl p-3 font-medium ${color}`}>{t.powerbank[level]}</p>
        </div>
      )}
      <p className="mt-3 text-sm text-muted">{t.powerbank.note}</p>
    </div>
  )
}
