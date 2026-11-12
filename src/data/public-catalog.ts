import { queryOptions, useQuery } from "@tanstack/react-query";
import { buildCategories, buildProduct, type CategoryRow, type ProductWithImages } from "./mappers";
import type { CategoryGroup, Product } from "@/types/catalog";

export interface CatalogData {
  categories: CategoryGroup[];
  products: Product[];
}
const EMPTY_CATALOG: CatalogData = { categories: [], products: [] };

// As consultas são sempre públicas, mesmo quando a dona da loja está logada.
async function readRows<T>(
  table: string,
  params: Record<string, string>,
  signal: AbortSignal,
): Promise<T[]> {
  const base = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!base || !key) throw new Error("As configurações do Supabase não foram informadas.");
  const result: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const url = new URL(`/rest/v1/${table}`, base);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    url.searchParams.set("limit", "1000");
    url.searchParams.set("offset", String(offset));
    const response = await fetch(url, { headers: { apikey: key }, signal });
    if (!response.ok) throw new Error("Não foi possível carregar o catálogo da loja.");
    const rows: T[] = await response.json();
    if (!Array.isArray(rows)) throw new Error("O catálogo retornado é inválido.");
    result.push(...rows);
    if (rows.length < 1000) return result;
  }
}

export const publicCatalogQueryOptions = queryOptions({
  queryKey: ["catalog", "products"],
  queryFn: async ({ signal }): Promise<CatalogData> => {
    const [categoryRows, productRows] = await Promise.all([
      readRows<CategoryRow>(
        "categories",
        { select: "*", is_active: "eq.true", order: "display_order,id" },
        signal,
      ),
      readRows<ProductWithImages>(
        "products",
        {
          select: "*,product_images(*)",
          status: "in.(published,sold_out)",
          order: "created_at.desc,id",
        },
        signal,
      ),
    ]);
    const categories = buildCategories(categoryRows);
    const visibleIds = new Set(
      categories.flatMap((g) => [g.id, ...g.subcategories.map((s) => s.id)]),
    );
    const products = productRows
      .filter(
        (p) =>
          (p.status === "published" || p.status === "sold_out") && visibleIds.has(p.category_id),
      )
      .map((p) => buildProduct(p, categoryRows));
    return { categories, products };
  },
  staleTime: 30_000,
  refetchOnWindowFocus: "always",
  retry: 1,
});

export function usePublicCatalog() {
  return useQuery(publicCatalogQueryOptions).data ?? EMPTY_CATALOG;
}
