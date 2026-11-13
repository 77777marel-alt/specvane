import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // CSP сначала в режиме отчётов (правило проекта); боевой режим — после 1–2 недель без отчётов.
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co https://cloudflareinsights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Выключено намеренно: неизвестный адрес должен отдавать настоящий 404, а первый ответ — полный HTML (SEO).
  partialPrefetching: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' },
    },
  },
  images: {
    // Картинки товаров — только из фидов сетей и Amazon API (ТЗ). Домены добавлять по мере подключения.
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    // виджеты /embed/* можно вставлять на любые сайты (iframe) — без X-Frame-Options: DENY
    return [
      { source: '/((?!embed/).*)', headers: securityHeaders },
      { source: '/embed/:path*', headers: securityHeaders.filter((h) => h.key !== 'X-Frame-Options' && !h.key.startsWith('Content-Security-Policy')) },
    ]
  },
}

export default nextConfig
