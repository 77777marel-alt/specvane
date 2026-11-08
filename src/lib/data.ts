import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from './supabase'
import type { Locale } from './i18n/config'

export type CategoryCard = { key: string; slug: string; name: string }

/** Активные категории на языке. Кеш: сутки (каталог обновляется ночным импортом). */
export async function getCategories(lang: Locale): Promise<CategoryCard[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('categories')
  const s = db()
  if (!s) return []
  const { data, error } = await s
    .from('category_i18n')
    .select('slug, name, categories!inner(key, sort, is_active)')
    .eq('lang', lang)
    .order('sort', { referencedTable: 'categories' })
  if (error || !data) return []
  return data.map((r) => {
    const c = r.categories as unknown as { key: string }
    return { key: c.key, slug: r.slug, name: r.name }
  })
}

export async function getCategoryBySlug(lang: Locale, slug: string): Promise<CategoryCard | null> {
  'use cache'
  cacheLife('hours')
  cacheTag('categories')
  const all = await getCategories(lang)
  return all.find((c) => c.slug === slug) ?? null
}
