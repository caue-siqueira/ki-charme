import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { CatalogView, parseCatalogSearch, type CatalogSearch } from "@/components/site/CatalogView";
import { publicCatalogQueryOptions, usePublicCatalog } from "@/data/public-catalog";
import { findCategoryBySlug } from "@/data/catalog";

export const Route = createFileRoute("/categoria/$slug")({
  validateSearch: (s: Record<string, unknown>): CatalogSearch => parseCatalogSearch(s),
  loader: async ({ params, context }) => {
    const { categories } = await context.queryClient.ensureQueryData(publicCatalogQueryOptions);
    const found = findCategoryBySlug(params.slug, categories);
    if (!found) throw notFound();
    return { title: found.sub?.name ?? found.group.name, groupName: found.group.name };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.title} — Ki Charme` : "Categoria — Ki Charme";
    return {
      meta: [
        { title: t },
        { name: "description", content: `Peças de ${loaderData?.title ?? "moda"} na Ki Charme.` },
        { property: "og:title", content: t },
        {
          property: "og:description",
          content: `Peças de ${loaderData?.title ?? "moda"} na Ki Charme.`,
        },
      ],
    };
  },
  component: Categoria,
  notFoundComponent: () => (
    <div className="container-site py-20 text-center">
      <h1 className="text-4xl">Categoria não encontrada</h1>
      <Link to="/catalogo" className="mt-6 inline-block font-semibold text-primary underline">
        Ver catálogo completo
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="container-site py-20 text-center">
      Não foi possível carregar esta categoria.
    </div>
  ),
});

function Categoria() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { categories } = usePublicCatalog();
  const found = findCategoryBySlug(slug, categories);
  if (!found) return <div className="container-site py-20">Categoria não encontrada.</div>;
  return (
    <CatalogView
      key={slug}
      title={found.sub?.name ?? found.group.name}
      intro={found.sub ? found.group.name : undefined}
      search={search}
      fixedGroup={found.group.id}
      fixedSub={found.sub?.id}
      onChange={(next) => navigate({ search: next, replace: true })}
    />
  );
}
