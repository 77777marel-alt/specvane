// Ключи всех категорий для импорта: ручные (categories.mjs + smartphones) и автоматические из базы.
import { createClient } from '@supabase/supabase-js'
import { CATEGORIES } from './categories.mjs'
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data } = await db.from('categories').select('key').eq('auto', true).order('sort')
console.log(['smartphones', ...Object.keys(CATEGORIES), ...(data ?? []).map((r) => r.key)].join(' '))
