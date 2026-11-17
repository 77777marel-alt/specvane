import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Те же боты, что закрыты в Vercel Firewall. Firewall отбивает их в любом случае,
// но послушный бот, прочитав robots.txt, просто не придёт — это экономит и запросы к CDN.
// Google и Bing НЕ трогаем: с них идёт поиск.
const BLOCKED = [
  'YandexBot', 'AhrefsBot', 'SemrushBot', 'SERanking', 'MJ12bot', 'DotBot', 'DataForSeoBot',
  'BLEXBot', 'Barkrowler', 'serpstat', 'PetalBot', 'Bytespider', 'Amazonbot',
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'CCBot', 'PerplexityBot', 'Reflectionbot', 'GoogleOther', 'meta-externalagent',
  'ImagesiftBot', 'Timpibot', 'Diffbot', 'omgili', 'YouBot', 'cohere-ai',
  'MojeekBot', 'SeznamBot', 'Baiduspider', 'Sogou', 'Applebot', 'DuckDuckBot',
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
