import type { Product } from "@/types/catalog";
import { cn } from "@/lib/utils";

/** Shows the product photo, or a blank placeholder until real photos are added. */
export function ProductImage({
  product,
  index = 0,
  className,
}: {
  product: Product;
  index?: number;
  className?: string;
}) {
  const img = product.images[index];
  return (
    <div className={cn("relative aspect-[3/4] w-full overflow-hidden bg-placeholder", className)}>
      {img ? (
        <img src={img.url} alt={img.alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div
          role="img"
          aria-label={`Foto de ${product.name} em breve`}
          className="flex h-full w-full items-end justify-center p-4"
        >
          <span className="eyebrow">Foto em breve</span>
        </div>
      )}
    </div>
  );
}
