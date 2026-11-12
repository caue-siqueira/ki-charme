import { formatBRL } from "@/lib/format";
import { isOnSale } from "@/data/catalog";
import type { Product } from "@/types/catalog";

export function Price({ product, large }: { product: Product; large?: boolean }) {
  const size = large ? "text-2xl" : "text-base";
  if (isOnSale(product)) {
    return (
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={`${size} font-semibold text-primary`}>
          {formatBRL(product.promoPrice!)}
        </span>
        <span className="text-sm text-muted-foreground line-through">
          <span className="sr-only">De </span>
          {formatBRL(product.price)}
        </span>
      </div>
    );
  }
  return <span className={`${size} font-semibold`}>{formatBRL(product.price)}</span>;
}
