import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publicCatalogQueryOptions } from "@/data/public-catalog";
import { categoryRows, makeProductRow } from "./catalog-fixtures";

const fetchMock = vi.fn<typeof fetch>();
let client: QueryClient;
function respond(categories = categoryRows, products = [makeProductRow()]) {
  fetchMock.mockImplementation(async (input) => {
    const url = new URL(String(input));
    return new Response(
      JSON.stringify(url.pathname.endsWith("/categories") ? categories : products),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  });
}
beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://store.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  respond();
});
afterEach(() => {
  client.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Catálogo público real", () => {
  it("usa as linhas do banco e os caminhos de fotos, sem depender do login", async () => {
    respond(categoryRows, [
      makeProductRow({
        product_images: [
          {
            id: "photo",
            product_id: "real-product",
            storage_path: "products/foto real.jpg",
            display_order: 0,
            alt_text: "Foto real",
            created_at: "2026-11-12T00:00:00Z",
            updated_at: "2026-11-12T00:00:00Z",
          },
        ],
      }),
    ]);
    const catalog = await client.fetchQuery(publicCatalogQueryOptions);
    expect(catalog.products.map((p) => p.name)).toEqual(["Peça cadastrada"]);
    expect(catalog.products[0]?.groupId).toBe("group");
    expect(catalog.products[0]?.images[0]?.url).toBe(
      "https://store.supabase.co/storage/v1/object/public/product-photos/products/foto%20real.jpg",
    );
    for (const [, init] of fetchMock.mock.calls) {
      expect(new Headers(init?.headers).get("authorization")).toBeNull();
    }
  });
  it("não preenche um catálogo vazio com produtos de exemplo", async () => {
    respond([], []);
    expect(await client.fetchQuery(publicCatalogQueryOptions)).toEqual({
      categories: [],
      products: [],
    });
  });
  it("exclui peças ocultas e categorias inativas, preservando peças esgotadas", async () => {
    respond(
      [...categoryRows, { ...categoryRows[1]!, id: "inactive", is_active: false }],
      [
        makeProductRow(),
        makeProductRow({ id: "sold", status: "sold_out" }),
        makeProductRow({ id: "hidden", status: "hidden" }),
        makeProductRow({ id: "inactive-category-product", category_id: "inactive" }),
      ],
    );
    const catalog = await client.fetchQuery(publicCatalogQueryOptions);
    expect(catalog.products.map((p) => p.id)).toEqual(["real-product", "sold"]);
    expect(catalog.categories[0]?.subcategories.map((c) => c.id)).toEqual(["category"]);
  });
  it("informa falha de conexão em vez de mostrar exemplos", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    await expect(client.fetchQuery({ ...publicCatalogQueryOptions, retry: false })).rejects.toThrow(
      "Não foi possível carregar o catálogo da loja.",
    );
  });
});
