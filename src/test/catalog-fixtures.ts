import type { Product, CategoryGroup } from "@/types/catalog";
import type { ProductWithImages, CategoryRow } from "@/data/mappers";

export function makeProduct(patch: Partial<Product> = {}): Product {
  return {
    id: "real-product",
    slug: "peca-real",
    name: "Peça cadastrada",
    description: "Descrição cadastrada",
    price: 100,
    groupId: "group",
    subcategoryId: "category",
    images: [],
    sizes: [],
    colors: [],
    status: "published",
    featured: false,
    createdAt: "2026-11-12T00:00:00Z",
    ...patch,
  };
}
export const categoryFixture: CategoryGroup = {
  id: "group",
  name: "Coleção cadastrada",
  slug: "colecao",
  order: 1,
  visible: true,
  subcategories: [{ id: "category", name: "Vestidos", slug: "vestidos", order: 1, visible: true }],
};
const timestamps = { created_at: "2026-11-12T00:00:00Z", updated_at: "2026-11-12T00:00:00Z" };
export const categoryRows: CategoryRow[] = [
  {
    id: "group",
    name: "Coleção cadastrada",
    slug: "colecao",
    parent_id: null,
    display_order: 1,
    is_active: true,
    ...timestamps,
  },
  {
    id: "category",
    name: "Vestidos",
    slug: "vestidos",
    parent_id: "group",
    display_order: 1,
    is_active: true,
    ...timestamps,
  },
];
export function makeProductRow(patch: Partial<ProductWithImages> = {}): ProductWithImages {
  return {
    id: "real-product",
    slug: "peca-real",
    name: "Peça cadastrada",
    description: "Descrição cadastrada",
    price: 100,
    promotional_price: null,
    category_id: "category",
    sizes: ["M"],
    colors: [],
    status: "published",
    is_featured: false,
    measurements: null,
    product_images: [],
    ...timestamps,
    ...patch,
  };
}
