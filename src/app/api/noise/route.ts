import { NextResponse, type NextRequest } from 'next/server'
import { isLocale } from '@/lib/i18n/config'
import { getNoiseData } from '@/lib/catalog'

// Шум моделей (дБ по этикетке) для «Карты шума дома»: холодильники, стиральные и сушильные машины.
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en'
  const cat = req.nextUrl.searchParams.get('cat') ?? 'fridges'
  if (!isLocale(lang)) return NextResponse.json({ items: [] }, { status: 400 })
  const data = await getNoiseData(lang, cat)
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } })
}
