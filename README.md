# Specvane

Сайт сравнений техники (specvane.com). Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind 4 + Supabase. Хостинг — Vercel.

- `src/lib/i18n/config.ts` — языки и магазины Amazon по странам.
- `src/lib/i18n/dict/*.ts` — тексты интерфейса (английский — источник, остальные проверяет TypeScript).
- `src/lib/routes.ts` — адреса разделов на языке страны (vergleich, beste, ratgeber…).
- `src/app/[lang]/[...slug]/page.tsx` — разборщик адресов: инфо-страницы, категории, далее товары и сравнения.
- `src/lib/sitemap` — индекс `/sitemap.xml` и файлы `/sitemaps/pages-de-1.xml` (без alternates; hreflang в `<head>`).
- `src/proxy.ts` — выбор языка только на «/», роботы всегда на /en.
- `supabase/migrations` — схема базы; `supabase/tests` — проверки на локальном PostgreSQL 16.

Деплой: `PUSH.cmd` → Vercel собирает сам. Переменные окружения — см. `.env.example`.
