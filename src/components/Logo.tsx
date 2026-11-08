// Флюгер-указатель: стрелка на мачте. Свой знак, без чужих логотипов.
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M16 6v20" stroke="var(--accent-fg)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 12h13l3 3-3 3H8l3-3z" fill="var(--accent-fg)" />
    </svg>
  )
}
