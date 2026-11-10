// Пересчёт пар «A vs B» и статистики характеристик (для «лучше, чем у N%») по всем категориям (после импорта). CATS — категории через пробел.
import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
for (const c of (process.env.CATS ?? 'smartphones').split(/\s+/).filter(Boolean)) {
  const { data, error } = await db.rpc('rebuild_comparisons', { p_category: c, p_per: 5 })
  const st = await db.rpc('rebuild_spec_stats', { p_category: c })
  const bs = await db.rpc('rebuild_brand_stats', { p_category: c })
  if (bs.error) console.log(c, 'бренды: ошибка', bs.error.message)
  console.log(c, error ? `ошибка: ${error.message}` : `${data} пар`, st.error ? `статистика: ошибка ${st.error.message}` : `статистика: ${st.data} характеристик`)
}
