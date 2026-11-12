import { useState } from "react";
import type { Product } from "@/types/catalog";
import { cn } from "@/lib/utils";

/** Exibe a foto real e uma alternativa legível se o arquivo estiver indisponível. */
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
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const unavailable = !!img && failedUrl === img.url;
  return (
    <div className={cn("relative aspect-[3/4] w-full overflow-hidden bg-placeholder", className)}>
      {img?.url && !unavailable ? (
        <img
          key={img.url}
          src={img.url}
          alt={img.alt}
          loading="lazy"
          onError={() => setFailedUrl(img.url)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={
            unavailable
              ? `Foto de ${product.name} indisponível`
              : `Foto de ${product.name} em breve`
          }
          className="flex h-full w-full items-end justify-center p-4"
        >
          <span className="eyebrow">{unavailable ? "Foto indisponível" : "Foto em breve"}</span>
        </div>
      )}
    </div>
  );
}
