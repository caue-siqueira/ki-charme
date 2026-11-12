import { Link } from "@tanstack/react-router";
import type { Product } from "@/types/catalog";
import { isNew, isOnSale } from "@/data/catalog";
import { ProductImage } from "./ProductImage";
import { Price } from "./Price";

export function ProductCard({ product }: { product: Product }) {
  const sale = isOnSale(product);
  const fresh = isNew(product);
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg bg-card shadow-soft">
      <Link to="/produto/$slug" params={{ slug: product.slug }} className="relative block">
        <ProductImage product={product} className="transition-opacity group-hover:opacity-90" />
        <div className="absolute left-3 top-3 flex gap-2">
          {sale && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Oferta
            </span>
          )}
          {fresh && !sale && (
            <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-accent-foreground">
              Novidade
            </span>
          )}
        </div>
        {product.status === "sold_out" && (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/70 py-2 text-center text-sm text-background">
            Esgotado
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-sans text-base font-medium leading-snug">{product.name}</h3>
        <Price product={product} />
        <Link
          to="/produto/$slug"
          params={{ slug: product.slug }}
          className="mt-auto inline-flex min-h-11 items-center justify-center rounded-md border border-primary/30 px-4 text-sm font-semibold text-primary transition-colors hover:bg-accent"
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
