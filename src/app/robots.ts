import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Те же боты, что закрыты в Vercel Firewall. Firewall отбивает их в любом случае,
// но послушный бот, прочитав robots.txt, просто не придёт — это экономит и запросы к CDN.
// Google, Bing и Яндекс НЕ трогаем: с них идёт поиск (Яндекс открыт 25.11.2026 ради ru/uk-аудитории).
// Поддельный «YandexBot» (AS Edge Technology Plus, Белград) режется в Cloudflare WAF, не здесь.
// 26.11.2026 (после переезда на VPS) открыты: поиск ИИ — OAI-SearchBot, ChatGPT-User, PerplexityBot
// (Claude-SearchBot/Claude-User и Perplexity-User и так не в списке), а также Applebot и DuckDuckBot.
// Боты ОБУЧЕНИЯ моделей (GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended…) остаются закрыты.
// Следить за нагрузкой сервера; если кто-то из открытых перегружает — вернуть сюда.
const BLOCKED = [
  'AhrefsBot', 'SemrushBot', 'SERanking', 'MJ12bot', 'DotBot', 'DataForSeoBot',
  'BLEXBot', 'Barkrowler', 'serpstat', 'PetalBot', 'Bytespider', 'Amazonbot',
  'GPTBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'CCBot', 'Reflectionbot', 'Google-Extended', 'Applebot-Extended', 'GoogleOther', 'meta-externalagent',
  'ImagesiftBot', 'Timpibot', 'Diffbot', 'omgili', 'YouBot', 'cohere-ai',
  'MojeekBot', 'SeznamBot', 'Baiduspider', 'Sogou',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/*/design-preview'] },
      ...BLOCKED.map((userAgent) => ({ userAgent, disallow: '/' })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
