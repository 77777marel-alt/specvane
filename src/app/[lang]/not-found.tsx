import Link from 'next/link'

// Тексты на английском: not-found не получает параметры языка.
export default function NotFound() {
  return (
    <section className="py-24 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-3 text-muted">Page not found</p>
      <Link href="/" className="mt-6 inline-block text-accent underline">Specvane</Link>
    </section>
  )
}
