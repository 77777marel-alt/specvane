import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/supabase'
import { isLocale } from '@/lib/i18n/config'

// Подсказки поиска: модели по названию (pg_trgm-индекс products_name_trgm) и по бренду.
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en'
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 60)
  const s = db()
  if (!s || !isLocale(lang) || q.length < 2) return NextResponse.json({ hits: [] })
  const like = `%${q.replace(/[%_\\]/g, (m) => '\\' + m)}%`
  const { data } = await s
    .from('products')
    .select('slug, name, brands!inner(name), categories!inner(category_i18n!inner(slug, name, lang))')
    .eq('categories.category_i18n.lang', lang)
    .eq('is_indexable', true)
    .or(`name.ilike.${like}`)
    .limit(8)
  type Row = { slug: string; name: string; brands: { name: string }; categories: { category_i18n: { slug: string; name: string }[] } }
  const hits = ((data ?? []) as unknown as Row[]).map((r) => {
    const c = r.categories.category_i18n[0]
    return { name: r.name, brand: r.brands.name, href: `/${lang}/${c.slug}/${r.slug}`, category: c.name }
  })
  return NextResponse.json({ hits }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } })
}
