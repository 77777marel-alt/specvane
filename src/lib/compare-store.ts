// Выбор моделей для сравнения (до 2, одна категория). Хранится в браузере, общий для всех вкладок/страниц.
export type CompareItem = { slug: string; name: string; brand: string; image?: string | null; cat: string; base: string }

const KEY = 'sv-compare'
const EVT = 'sv-compare'
let cache: CompareItem[] | null = null
const EMPTY: CompareItem[] = []

function read(): CompareItem[] {
  if (cache) return cache
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { cache = [] }
  if (!Array.isArray(cache)) cache = []
  return cache
}
function write(v: CompareItem[]) {
  cache = v
  try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* приватный режим — живём в памяти */ }
  window.dispatchEvent(new Event(EVT))
}

export const compareStore = {
  get: (): CompareItem[] => (typeof window === 'undefined' ? EMPTY : read()),
  getServer: (): CompareItem[] => EMPTY,
  subscribe(fn: () => void) {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; fn() } }
    window.addEventListener(EVT, fn); window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(EVT, fn); window.removeEventListener('storage', onStorage) }
  },
  has: (slug: string) => read().some((x) => x.slug === slug),
  toggle(item: CompareItem) {
    const cur = read()
    if (cur.some((x) => x.slug === item.slug)) return write(cur.filter((x) => x.slug !== item.slug))
    const same = cur.filter((x) => x.cat === item.cat) // другая категория — начинаем заново
    write([...same, item].slice(-2))
  },
  remove: (slug: string) => write(read().filter((x) => x.slug !== slug)),
  clear: () => write([]),
}
