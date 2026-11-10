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

export function ToolCalc({ tool, t, lang, imperialDefault, tariff = 0.3, currency = 'EUR' }: { tool: ToolKey; t: ToolsText; lang: string; imperialDefault: boolean; tariff?: number; currency?: string }) {
  const [imp, setImp] = useState(imperialDefault)
  const f = (n: number, d = 1) => new Intl.NumberFormat(lang, { maximumFractionDigits: d }).format(n)
  const len = (m: number) => (imp ? `${f(m * 3.28084)} ft` : `${f(m, 2)} m`)
  // --- размер телевизора: диагональ = расстояние / 1,6 (угол 30°) … расстояние / 1,2 (угол 40°)
  const [dist, setDist] = useState(imperialDefault ? '8' : '2.5')

  // --- проектор
  const [ratio, setRatio] = useState('1.5'), [pdiag, setPdiag] = useState('100'), [aspect, setAspect] = useState('16:9')
  // --- PPI
  const [pw, setPw] = useState('2560'), [ph, setPh] = useState('1440'), [sd, setSd] = useState('27')
  // --- пауэрбанк
  const [mah, setMah] = useState('20000'), [volt, setVolt] = useState('3.7')
  // --- кондиционер / котёл / семья / электричество
  const [area, setArea] = useState(imperialDefault ? '200' : '20'), [ceil, setCeil] = useState(imperialDefault ? '8' : '2.7')
  const [ins, setIns] = useState<'good' | 'avg' | 'poor'>('avg'), [sun, setSun] = useState(false)
  const [harea, setHarea] = useState(imperialDefault ? '1000' : '100'), [baths, setBaths] = useState('1')
  const [people, setPeople] = useState('3')
  const [watts, setWatts] = useState('100'), [hours, setHours] = useState('4'), [days, setDays] = useState('365'), [price, setPrice] = useState(String(tariff))
  const money = (n: number) => new Intl.NumberFormat(lang, { style: 'currency', currency, maximumFractionDigits: n < 10 ? 2 : 0 }).format(n)
  const insSelect = (txt: { insulation: string; insGood: string; insAvg: string; insPoor: string }) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{txt.insulation}</span>
      <select value={ins} onChange={(e) => setIns(e.target.value as 'good' | 'avg' | 'poor')} className="h-12 w-full rounded-xl border border-border bg-bg px-3 text-lg">
        <option value="good">{txt.insGood}</option><option value="avg">{txt.insAvg}</option><option value="poor">{txt.insPoor}</option>
      </select>
    </label>
  )
  const sqm = (v: number | null) => (v == null ? null : imp ? v * 0.092903 : v) // ft² → m²
  const toggle = (
    <div className="mb-4 inline-flex rounded-xl border border-border p-1 text-sm" role="group">
      {[false, true].map((v) => (
        <button key={String(v)} type="button" aria-pressed={imp === v} onClick={() => { if (v !== imp) { const cv = (x: string, k: number, set: (s: string) => void) => { const d = num(x); if (d) set(String(Math.round((v ? d * k : d / k) * 10) / 10)) }; cv(dist, 3.28084, setDist); cv(ceil, 3.28084, setCeil); cv(area, 10.7639, setArea); cv(harea, 10.7639, setHarea) } setImp(v) }}
          className={`rounded-lg px-3 py-1.5 ${imp === v ? 'bg-accent text-accent-fg' : 'text-muted'}`}>{v ? t.imperial : t.metric}</button>
      ))}
    </div>
  )

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

  if (tool === 'ac') {
    // объём комнаты × 30/35/40 Вт на м³ (утепление), +15% солнечная сторона/верхний этаж
    const a = sqm(num(area)), hgt = num(ceil)
    const hM = hgt ? (imp ? hgt * 0.3048 : hgt) : null
    const kw = a && hM ? (a * hM * { good: 30, avg: 35, poor: 40 }[ins] * (sun ? 1.15 : 1)) / 1000 : null
    const STD = [[2.0, 7000], [2.5, 9000], [3.5, 12000], [5.0, 18000], [6.0, 21000], [7.1, 24000], [8.5, 30000]] as const
    const pick = kw ? STD.find(([k]) => k >= kw) ?? null : null
    return (
      <div>
        {toggle}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.area} value={area} onChange={setArea} unit={imp ? 'ft²' : 'm²'} />
          <Field label={t.ac.height} value={ceil} onChange={setCeil} unit={imp ? 'ft' : 'm'} />
          {insSelect(t.ac)}
          <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-border px-3">
            <input type="checkbox" checked={sun} onChange={(e) => setSun(e.target.checked)} className="h-5 w-5" /><span>{t.ac.sun}</span>
          </label>
        </div>
        {kw && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Out big label={t.ac.power} value={`${f(kw, 1)} kW · ${f(Math.round(kw * 3412 / 100) * 100, 0)} BTU/h`} />
            <Out label={t.ac.sizes} value={pick ? `${f(pick[0], 1)} kW (${f(pick[1], 0)} BTU)` : `> 8,5 kW`} />
          </div>
        )}
        <p className="mt-3 text-sm text-muted">{t.ac.note}</p>
      </div>
    )
  }

  if (tool === 'boiler') {
    // теплопотери: 50/80/120 Вт на м² по утеплению; ГВС для комби: 1 ванная 24 кВт, 2 — 30, 3+ — 35
    const a = sqm(num(harea)), b = Math.max(1, Math.round(num(baths) ?? 1))
    const heat = a ? (a * { good: 50, avg: 80, poor: 120 }[ins]) / 1000 : null
    const dhw = b >= 3 ? 35 : b === 2 ? 30 : 24
    const combi = heat ? Math.max(dhw, Math.ceil(heat)) : null
    return (
      <div>
        {toggle}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t.areaHome} value={harea} onChange={setHarea} unit={imp ? 'ft²' : 'm²'} />
          {insSelect(t.boiler)}
          <Field label={t.boiler.baths} value={baths} onChange={setBaths} step="1" />
        </div>
        {heat && combi && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Out label={t.boiler.heat} value={`${f(heat, 1)} kW`} />
            <Out big label={t.boiler.combi} value={`${f(combi, 0)} kW`} />
          </div>
        )}
        <p className="mt-3 text-sm text-muted">{t.boiler.note}</p>
      </div>
    )
  }

  if (tool === 'household') {
    const p = Math.max(1, Math.min(10, Math.round(num(people) ?? 1)))
    const fr = [100 + 60 * p, 140 + 70 * p].map((x) => Math.round(x / 10) * 10)
    const wash = p <= 1 ? '5–6' : p === 2 ? '6–7' : p <= 4 ? '7–9' : '9–11'
    return (
      <div>
        <div className="max-w-xs"><Field label={t.household.people} value={people} onChange={setPeople} step="1" /></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Out big label={t.household.fridge} value={`${f(fr[0], 0)}–${f(fr[1], 0)} L`} />
          <Out big label={t.household.washer} value={`${wash} kg`} />
          <Out label={t.household.dishwasher} value={p <= 2 ? t.household.slim : t.household.full} />
        </div>
        <p className="mt-3 text-sm text-muted">{t.household.note}</p>
      </div>
    )
  }

  if (tool === 'energy') {
    const w = num(watts), h = num(hours), d = num(days), pr = num(price)
    const kwh = w && h && d ? (w * Math.min(h, 24) * Math.min(d, 366)) / 1000 : null
    const year = kwh && pr ? kwh * pr : null
    return (
      <div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t.energy.watts} value={watts} onChange={setWatts} unit="W" />
          <Field label={t.energy.hours} value={hours} onChange={setHours} />
          <Field label={t.energy.days} value={days} onChange={setDays} step="1" />
          <Field label={t.energy.tariff} value={price} onChange={setPrice} unit={currency} />
        </div>
        {kwh && year != null && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Out big label={t.energy.perYear} value={money(year)} />
            <Out label={t.energy.perMonth} value={money(year / 12)} />
            <Out label={t.energy.kwh} value={`${f(kwh, 0)} kWh`} />
          </div>
        )}
        <p className="mt-3 text-sm text-muted">{t.energy.note}</p>
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
