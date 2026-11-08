import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null | undefined

/**
 * Клиент только для чтения витрины (анонимный ключ + RLS).
 * Без переменных окружения возвращает null — сайт собирается и без базы (этап 0).
 */
export function db(): SupabaseClient | null {
  if (client !== undefined) return client
  // Ключ читается только на сервере, поэтому без префикса NEXT_PUBLIC_ (в браузер не попадает).
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null
  return client
}
