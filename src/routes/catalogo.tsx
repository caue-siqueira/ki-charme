import { createFileRoute } from "@tanstack/react-router";
import { CatalogView, parseCatalogSearch, type CatalogSearch } from "@/components/site/CatalogView";

export const Route = createFileRoute("/catalogo")({
  validateSearch: (s: Record<string, unknown>): CatalogSearch => parseCatalogSearch(s),
  head: () => ({
    meta: [
      { title: "Catálogo — Ki Charme" },
      {
        name: "description",
        content: "Veja todas as peças de moda feminina e acessórios da Ki Charme.",
      },
      { property: "og:title", content: "Catálogo — Ki Charme" },
      {
        property: "og:description",
        content: "Todas as peças de moda feminina e acessórios da Ki Charme.",
      },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CatalogView
      title="Catálogo"
      search={search}
      onChange={(next) => navigate({ search: next, replace: true })}
    />
  );
}
