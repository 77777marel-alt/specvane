// Английский — источник. Остальные словари обязаны иметь те же ключи (проверяет TypeScript).
export const en = {
  meta: {
    homeTitle: 'Specvane — compare tech by the numbers',
    homeDescription:
      'Side-by-side spec comparisons, price history and buying guides for phones, laptops, TVs, projectors, headphones and more.',
  },
  nav: { categories: 'Categories', compare: 'Compare', best: 'Best picks', new: 'New releases', guides: 'Buying guides', language: 'Language', menu: 'Menu' },
  home: {
    h1: 'Compare tech by the numbers',
    lead: 'Specs side by side, real price history and clear “who it’s for” verdicts — without fake tests or invented reviews.',
    categoriesTitle: 'Categories',
    comingSoon: 'The catalogue is being filled right now. First categories are coming soon.',
    howTitle: 'How Specvane works',
    how1: 'We collect specifications from manufacturers and official data sources.',
    how2: 'We track prices in shops in your country every day.',
    how3: 'We compare models on facts and tell you who each one suits.',
    honestTitle: 'What we don’t do',
    honest: 'We don’t claim to have tested products in a lab, and we never invent user reviews. Ratings appear only when they come from a real source, and it is always named.',
  },
  footer: {
    disclosure: 'We may earn a commission when you buy through links on this site — the price you pay stays the same.',
    rights: 'All brand and product names belong to their owners.',
  },
  info: {
    about: { title: 'About Specvane', body: [
      'Specvane helps you choose electronics by comparing models on specifications, prices and open data.',
      'Our pages are built from manufacturer specifications, partner shop feeds and official announcements. Texts are written from these numbers; we do not claim hands-on testing.',
      'Found a mistake in a spec or price? Write to us and we will fix it.',
    ] },
    'how-we-make-money': { title: 'How we make money', body: [
      'Some links on Specvane are affiliate links (Amazon Associates and shop partner networks). If you buy through them, we may receive a small commission. The price for you does not change.',
      'Shops are sorted by price, not by commission. Sponsored placements, if they ever appear, will be clearly marked.',
      'As an Amazon Associate we earn from qualifying purchases.',
    ] },
    privacy: { title: 'Privacy policy', body: [
      'We do not require an account and do not sell personal data.',
      'Analytics and affiliate cookies are only used after you give consent. Your country is detected from the request only to choose the right shop for the “Buy” button; we do not store it.',
      'Contact us at info@specvane.com for any privacy question or to exercise your GDPR rights.',
    ] },
    cookies: { title: 'Cookies', body: [
      'Strictly necessary cookies keep the site working. Analytics and affiliate cookies are set only after consent, and you can withdraw consent at any time.',
    ] },
    contact: { title: 'Contact', body: ['Email: info@specvane.com', 'We answer in English, German, Greek and Russian.'] },
    'legal-notice': { title: 'Legal notice', body: [
      'Specvane is operated by MAXWEBCREATIVE, Maxim Marinin (sole trader), Fylis 274, 11253 Athens, Greece.',
      'Email: info@specvane.com',
    ] },
  },
  common: { updated: 'Updated', notFound: 'Page not found', backHome: 'Back to home' },
}

type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? Widen<U>[] : { [K in keyof T]: Widen<T[K]> }
export type Dict = Widen<typeof en>
