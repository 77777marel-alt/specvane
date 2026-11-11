import { NextResponse, type NextRequest } from 'next/server'
import { isLocale } from '@/lib/i18n/config'
import { getSizeData } from '@/lib/catalog'

// Габариты моделей для «Реального размера» (телефоны, планшеты, часы, ТВ).
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en'
  const cat = req.nextUrl.searchParams.get('cat') ?? 'smartphones'
  if (!isLocale(lang)) return NextResponse.json({ items: [] }, { status: 400 })
  const items = await getSizeData(lang, cat)
  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } })
}
