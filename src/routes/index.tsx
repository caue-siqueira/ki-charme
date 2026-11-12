import { createFileRoute, Link } from "@tanstack/react-router";
import { getFeatured, getNewest, getOnSale } from "@/data/catalog";
import { useStoreSettings } from "@/data/store-settings";
import { ProductGrid } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ki Charme — Seu estilo, seu charme" },
      {
        name: "description",
        content:
          "Moda feminina e acessórios com elegância e praticidade. Escolha suas peças e finalize pelo WhatsApp.",
      },
      { property: "og:title", content: "Ki Charme — Seu estilo, seu charme" },
      {
        property: "og:description",
        content: "Moda feminina e acessórios com elegância e praticidade.",
      },
    ],
  }),
  component: Index,
});

function Section({
  eyebrow,
  title,
  children,
  link,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  link?: React.ReactNode;
}) {
  return (
    <section className="container-site py-14">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 text-3xl md:text-4xl">{title}</h2>
        </div>
        {link}
      </div>
      {children}
    </section>
  );
}

const seeAll = (
  <Link
    to="/catalogo"
    className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
  >
    Ver tudo
  </Link>
);

function Index() {
  const s = useStoreSettings();
  const sale = getOnSale();
  return (
    <>
      <section className="container-site grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
        <div className="order-2 md:order-1">
          <p className="eyebrow">{s.tagline}</p>
          <h1 className="mt-4 text-5xl md:text-7xl">
            Seu estilo, <em className="text-primary">seu charme.</em>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Peças escolhidas com carinho para acompanhar você em todos os momentos.
          </p>
          <Link
            to="/catalogo"
            className="mt-8 inline-flex min-h-12 items-center rounded-md bg-primary px-8 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Conhecer coleção
          </Link>
        </div>
        <div
          className="order-1 aspect-[16/9] w-full md:aspect-[4/5] rounded-lg bg-secondary md:order-2"
          role="img"
          aria-label="Espaço reservado para foto da coleção"
        />
      </section>

      <Section eyebrow="Acabou de chegar" title="Novidades" link={seeAll}>
        <ProductGrid products={getNewest(4)} />
      </Section>
      <Section eyebrow="Seleção da loja" title="Destaques" link={seeAll}>
        <ProductGrid products={getFeatured(4)} />
      </Section>
      {sale.length > 0 && (
        <Section eyebrow="Preços especiais" title="Promoções">
          <ProductGrid products={sale} />
        </Section>
      )}

      <section className="container-site py-14">
        <div className="rounded-2xl bg-secondary px-6 py-12 text-center md:px-16">
          <p className="eyebrow">Sobre a {s.name}</p>
          <h2 className="mt-3 text-3xl md:text-4xl">Venha nos visitar</h2>
          <p className="mx-auto mt-4 max-w-2xl">{s.about}</p>
          <Link
            to="/sobre"
            className="mt-8 inline-flex min-h-12 items-center rounded-md border border-primary px-8 font-semibold text-primary hover:bg-card"
          >
            Contato e localização
          </Link>
        </div>
      </section>
    </>
  );
}
