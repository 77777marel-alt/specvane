// Модели данных для шаблонов страниц. На этапе 1 их заполняет слой данных из Supabase.
export type SpecValue = {
  key: string
  label: string
  /** число в единых единицах, да/нет или текст */
  value: number | boolean | string | null
  /** готовая строка для показа («3 000 лм», «Да») */
  display: string
  higherIsBetter?: boolean | null
}
export type SpecGroup = { name: string; specs: SpecValue[] }
export type Offer = { shop: string; price: number | null; currency: string; url: string; inStock: boolean; updatedAt: string }
export type PricePoint = { day: string; price: number }
export type ProductCardData = {
  slug: string; href: string; name: string; brand: string; image?: string | null
  price?: number | null; currency: string; keySpecs: SpecValue[]; verdict?: string
  /** значения для фильтров: v — сырое, d — для показа */
  facets?: Record<string, { v: number | boolean | string | null; d: string }>
  release?: string | null
}
export type ProductView = ProductCardData & {
  category: { name: string; href: string }
  releaseDate?: string | null
  whoFor: string
  pros: string[]
  cons: string[]
  specGroups: SpecGroup[]
  offers: Offer[]
  priceHistory: PricePoint[]
  updatedAt: string
  alternatives: ProductCardData[]
}
