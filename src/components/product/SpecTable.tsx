import type { SpecGroup } from '@/lib/types'

export function SpecTable({ groups, title }: { groups: SpecGroup[]; title: string }) {
  return (
    <section aria-labelledby="specs" className="space-y-3">
      <h2 id="specs" className="text-xl font-semibold">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-border">
        {groups.map((g) => (
          <table key={g.name} className="w-full text-sm">
            <caption className="bg-surface px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">{g.name}</caption>
            <tbody className="divide-y divide-border">
              {g.specs.map((s) => (
                <tr key={s.key}>
                  <th scope="row" className="w-1/2 px-4 py-2.5 text-left font-normal text-muted">{s.label}</th>
                  <td className="num px-4 py-2.5 font-medium">{s.display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </section>
  )
}
