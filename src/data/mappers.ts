// Converte as linhas do banco nos tipos que a interface usa.
import type { Database } from "@/integrations/supabase/types";
import { photoUrl } from "@/lib/media";
import { summarizeOpeningHours } from "@/lib/opening-hours";
import type {
  CategoryGroup,
  Product,
  ProductColor,
  ProductStatus,
  StoreSettings,
} from "@/types/catalog";

type Tables = Database["public"]["Tables"];

export type CategoryRow = Tables["categories"]["Row"];
export type ProductRow = Tables["products"]["Row"];
export type ProductImageRow = Tables["product_images"]["Row"];
export type SettingsRow = Tables["store_settings"]["Row"];
export type ProductWithImages = ProductRow & { product_images: ProductImageRow[] | null };

export interface PublicCatalog {
  products: Product[];
  categories: CategoryGroup[];
  settings: StoreSettings;
}

const byOrder = (
  a: { display_order: number; name: string },
  b: { display_order: number; name: string },
) => a.display_order - b.display_order || a.name.localeCompare(b.name, "pt-BR");

// Grupos de primeiro nível com suas subcategorias, já na ordem de exibição.
export function buildCategories(rows: CategoryRow[]): CategoryGroup[] {
  const groups = rows.filter((r) => r.parent_id === null && r.is_active).sort(byOrder);
  const subs = rows.filter((r) => r.parent_id !== null && r.is_active);
  return groups.map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    order: g.display_order,
    visible: true,
    subcategories: subs
      .filter((s) => s.parent_id === g.id)
      .sort(byOrder)
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        order: s.display_order,
        visible: true,
      })),
  }));
}

// Uma peça pode estar ligada a um grupo ou a uma subcategoria.
export function categoryLocation(
  rows: CategoryRow[],
  categoryId: string,
): { groupId: string; subcategoryId: string } {
  const row = rows.find((r) => r.id === categoryId);
  if (!row) return { groupId: categoryId, subcategoryId: categoryId };
  if (row.parent_id) return { groupId: row.parent_id, subcategoryId: row.id };
  return { groupId: row.id, subcategoryId: row.id };
}

export function toColors(value: unknown): ProductColor[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const rec = entry as Record<string, unknown>;
    const name = typeof rec["name"] === "string" ? rec["name"].trim() : "";
    if (!name) return [];
    const swatch =
      typeof rec["swatch"] === "string" && rec["swatch"].trim() ? rec["swatch"].trim() : undefined;
    return [{ name, swatch }];
  });
}

export function buildProduct(row: ProductWithImages, categoryRows: CategoryRow[]): Product {
  const { groupId, subcategoryId } = categoryLocation(categoryRows, row.category_id);
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => ({
      url: photoUrl(img.storage_path),
      alt: img.alt_text && img.alt_text.trim() ? img.alt_text : row.name,
    }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    promoPrice: row.promotional_price === null ? undefined : Number(row.promotional_price),
    groupId,
    subcategoryId,
    images,
    sizes: row.sizes ?? [],
    colors: toColors(row.colors),
    status: row.status as ProductStatus,
    featured: row.is_featured,
    createdAt: row.created_at,
    measurements: row.measurements ?? undefined,
  };
}

export const DEFAULT_SETTINGS: StoreSettings = {
  name: "Ki Charme",
  tagline: "Moda Feminina & Acessórios",
  whatsappNumber: "",
  about:
    "A Ki Charme é uma loja de moda feminina e acessórios. Mostro as peças que chegam aqui no site e combinamos a venda pelo WhatsApp: você escolhe, eu separo e a gente conversa sobre tamanhos, medidas e retirada.",
};

export function buildSettings(row: SettingsRow | null): StoreSettings {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    name: row.store_name,
    tagline: row.subtitle,
    whatsappNumber: row.whatsapp_number,
    instagram: row.instagram_url ?? undefined,
    address: row.address ?? undefined,
    hours: row.opening_hours == null ? undefined : summarizeOpeningHours(row.opening_hours),
    exchangePolicy: row.exchange_policy ?? undefined,
    pickupInfo: row.pickup_information ?? undefined,
    about: row.about ?? DEFAULT_SETTINGS.about,
  };
}
