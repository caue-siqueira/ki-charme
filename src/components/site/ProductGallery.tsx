import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types/catalog";
import { ProductImage } from "./ProductImage";

export function ProductGallery({ product }: { product: Product }) {
  const [viewportRef, api] = useEmblaCarousel({ align: "start" });
  const [active, setActive] = useState(0);
  const count = Math.max(product.images.length, 1);

  useEffect(() => {
    if (!api) return;
    const sync = () => setActive(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  return (
    <section
      className="min-w-0"
      aria-label={`Fotos de ${product.name}`}
      aria-roledescription="carrossel"
    >
      <div className="relative">
        <div ref={viewportRef} className="overflow-hidden rounded-lg">
          <div className="flex touch-pan-y touch-pinch-zoom cursor-grab active:cursor-grabbing">
            {Array.from({ length: count }, (_, index) => (
              <div
                key={index}
                className="min-w-0 flex-[0_0_100%]"
                role="group"
                aria-label={`Foto ${index + 1} de ${count}`}
              >
                <ProductImage product={product} index={index} />
              </div>
            ))}
          </div>
        </div>
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              disabled={active === 0}
              onClick={() => api?.scrollPrev()}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-card/90 disabled:opacity-40"
            >
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              disabled={active === count - 1}
              onClick={() => api?.scrollNext()}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-card/90 disabled:opacity-40"
            >
              <ChevronRight aria-hidden className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <>
          <p className="mt-2 text-center text-xs text-muted-foreground" aria-live="polite">
            {active + 1} / {count} · Arraste para ver mais fotos
          </p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {product.images.map((_, index) => (
              <button
                type="button"
                key={index}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-pressed={index === active}
                className={`overflow-hidden rounded-md border-2 ${index === active ? "border-primary" : "border-transparent"}`}
              >
                <ProductImage product={product} index={index} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
