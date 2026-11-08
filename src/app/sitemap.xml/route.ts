import { indexXml, listFiles } from '@/lib/sitemap'

export async function GET() {
  const xml = indexXml(await listFiles())
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
