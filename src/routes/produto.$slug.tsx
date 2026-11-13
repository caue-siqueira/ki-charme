import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { categoryName, effectivePrice, getProductBySlug, getRelated } from "@/data/catalog";
import { publicCatalogQueryOptions, usePublicCatalog } from "@/data/public-catalog";
import type { Product, CategoryGroup } from "@/types/catalog";
import { useCart } from "@/lib/cart";
import { productMessage } from "@/lib/whatsapp";
import { ProductGallery } from "@/components/site/ProductGallery";
import { Price } from "@/components/site/Price";
import { ProductGrid } from "@/components/site/ProductCard";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params, context }) => {
    const { products } = await context.queryClient.ensureQueryData(publicCatalogQueryOptions);
    const p = getProductBySlug(params.slug, products);
    if (!p) throw notFound();
    return { name: p.name, description: p.description };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.name} — Ki Charme` : "Produto — Ki Charme";
    return {
      meta: [
        { title: t },
        { name: "description", content: loaderData?.description ?? "Peça da Ki Charme." },
        { property: "og:title", content: t },
        { property: "og:description", content: loaderData?.description ?? "Peça da Ki Charme." },
        { property: "og:type", content: "product" },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="container-site py-20 text-center">
      <h1 className="text-4xl">Peça não encontrada</h1>
      <Link to="/catalogo" className="mt-6 inline-block font-semibold text-primary underline">
        Voltar ao catálogo
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="container-site py-20 text-center">Não foi possível carregar esta peça.</div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { products, categories } = usePublicCatalog();
  const p = getProductBySlug(slug, products);
  if (!p) return <div className="container-site py-20">Peça não encontrada.</div>;
  return <ProductDetails key={p.id} product={p} products={products} categories={categories} />;
}

function ProductDetails({
  product: p,
  products,
  categories,
}: {
  product: Product;
  products: Product[];
  categories: CategoryGroup[];
}) {
  const cart = useCart();
  const [size, setSize] = useState<string | undefined>(
    p.sizes.length === 1 ? p.sizes[0] : undefined,
  );
  const [color, setColor] = useState<string | undefined>(
    p.colors.length === 1 ? p.colors[0]!.name : undefined,
  );
  const [warn, setWarn] = useState(false);
  const soldOut = p.status === "sold_out";
  const ready = () => {
    if ((p.sizes.length && !size) || (p.colors.length && !color)) {
      setWarn(true);
      return false;
    }
    return true;
  };
  const add = () => {
    if (!ready()) return;
    cart.add({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      price: effectivePrice(p),
      size,
      color,
      quantity: 1,
    });
    toast.success("Adicionado à sacola", {
      description: `${p.name}${size ? ` · ${size}` : ""}`,
      action: {
        label: "Ver sacola",
        onClick: () => {
          window.location.href = "/sacola";
        },
      },
    });
  };

  return (
    <div className="container-site py-8">
      <nav aria-label="Caminho" className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">
          Início
        </Link>{" "}
        /{" "}
        <Link to="/catalogo" className="hover:underline">
          Catálogo
        </Link>{" "}
        / <span>{categoryName(p.subcategoryId, categories)}</span>
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery product={p} />
        <div>
          <p className="eyebrow">
            {categoryName(p.groupId, categories)} · {categoryName(p.subcategoryId, categories)}
          </p>
          <h1 className="mt-2 text-4xl md:text-5xl">{p.name}</h1>
          <div className="mt-4">
            <Price product={p} large />
          </div>
          <p className="mt-6">{p.description}</p>

          {p.colors.length > 0 && (
            <fieldset className="mt-8">
              <legend className="mb-2 font-semibold">Cor{color && `: ${color}`}</legend>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((c) => (
                  <button
                    key={c.name}
                    aria-pressed={color === c.name}
                    onClick={() => {
                      setColor(c.name);
                      setWarn(false);
                    }}
                    className={`flex min-h-11 items-center gap-2 rounded-full border px-4 ${color === c.name ? "border-primary ring-1 ring-primary" : "border-input bg-card"}`}
                  >
                    {c.swatch && (
                      <span
                        className="h-5 w-5 rounded-full border border-border"
                        style={{ background: c.swatch }}
                        aria-hidden
                      />
                    )}
                    {c.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {p.sizes.length > 0 && (
            <fieldset className="mt-6">
              <legend className="mb-2 font-semibold">Tamanho</legend>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    aria-pressed={size === s}
                    onClick={() => {
                      setSize(s);
                      setWarn(false);
                    }}
                    className={`min-h-12 min-w-12 rounded-md border px-4 font-semibold ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {warn && (
            <p role="alert" className="mt-3 text-sm font-semibold text-destructive">
              Escolha {p.sizes.length && !size ? "o tamanho" : "a cor"} antes de continuar.
            </p>
          )}

          <p className="mt-6 text-sm">
            {soldOut ? <strong>Esgotado no momento</strong> : "Disponível para consulta"}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton
              className="flex-1"
              message={() =>
                productMessage({
                  name: p.name,
                  size,
                  color,
                  price: effectivePrice(p),
                  url: window.location.href,
                })
              }
            />
            {!soldOut && (
              <button
                onClick={add}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md border border-primary px-5 font-semibold text-primary hover:bg-accent"
              >
                <ShoppingBag className="h-5 w-5" aria-hidden /> Adicionar à sacola
              </button>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Disponibilidade sujeita à confirmação pela loja.
          </p>
          {p.measurements && (
            <div className="mt-8 rounded-lg bg-card p-5">
              <h2 className="font-sans text-base font-semibold">Medidas</h2>
              <p className="mt-2 whitespace-pre-line text-sm">{p.measurements}</p>
            </div>
          )}
        </div>
      </div>
      {getRelated(p, products).length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-3xl">Você também pode gostar</h2>
          <ProductGrid products={getRelated(p, products)} />
        </section>
      )}
    </div>
  );
}
