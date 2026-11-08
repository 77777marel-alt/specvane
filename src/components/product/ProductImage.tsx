import { IconImage } from '../icons'

/** Фото товара (только из фидов/API по ТЗ). Пока фото нет — нейтральная заглушка того же размера. */
export function ProductImage({ src, alt, className = '', ratio = 'aspect-[4/3]' }: { src?: string | null; alt: string; className?: string; ratio?: string }) {
  return (
    <div className={`relative flex ${ratio} items-center justify-center overflow-hidden rounded-2xl bg-surface ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- фото Icecat отдаются с их CDN (images.icecat.biz)
        <img src={src} alt={alt} className="h-full w-full object-contain p-3 mix-blend-multiply dark:mix-blend-normal" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      ) : (
        <IconImage className="h-1/3 w-1/3 text-muted/40" />
      )}
    </div>
  )
}
