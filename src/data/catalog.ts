// Single data access layer. Components never import demo arrays directly.
// Stage 2: replace these bodies with database queries; signatures stay.
import { demoCategories, demoProducts, demoSettings } from "./demo-data";
import type { CategoryGroup, Product, StoreSettings } from "@/types/catalog";

export function getStoreSettings(): StoreSettings {
  return demoSettings;
}

export function getCategories(): CategoryGroup[] {
  return demoCategories
    .filter((g) => g.visible)
    .sort((a, b) => a.order - b.order)
    .map((g) => ({
      ...g,
      subcategories: g.subcategories.filter((s) => s.visible).sort((a, b) => a.order - b.order),
    }));
}

export function findCategoryBySlug(slug: string) {
  for (const group of getCategories()) {
    if (group.slug === slug) return { group, sub: undefined };
    const sub = group.subcategories.find((s) => s.slug === slug);
    if (sub) return { group, sub };
  }
  return undefined;
}

export function getProducts(): Product[] {
  return demoProducts.filter((p) => p.status !== "hidden");
}

export function getProductBySlug(slug: string) {
  return getProducts().find((p) => p.slug === slug);
}

export const effectivePrice = (p: Pick<Product, "price" | "promoPrice">) =>
  p.promoPrice != null && p.promoPrice < p.price ? p.promoPrice : p.price;

export const isOnSale = (p: Product) => p.promoPrice != null && p.promoPrice < p.price;

const NEW_DAYS = 30;
export const isNew = (p: Product, now = new Date()) =>
  (now.getTime() - new Date(p.createdAt).getTime()) / 86400000 <= NEW_DAYS;

export const getNewest = (n = 4) =>
  [...getProducts()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, n);
export const getFeatured = (n = 4) =>
  getProducts()
    .filter((p) => p.featured)
    .slice(0, n);
export const getOnSale = () => getProducts().filter(isOnSale);

export function getRelated(p: Product, n = 4) {
  const same = getProducts().filter((x) => x.id !== p.id && x.subcategoryId === p.subcategoryId);
  const group = getProducts().filter(
    (x) => x.id !== p.id && x.groupId === p.groupId && !same.includes(x),
  );
  return [...same, ...group].slice(0, n);
}

export function categoryName(id: string) {
  for (const g of getCategories()) {
    if (g.id === id) return g.name;
    const s = g.subcategories.find((s) => s.id === id);
    if (s) return s.name;
  }
  return "";
}

export interface ProductFilters {
  q?: string | undefined;
  group?: string | undefined;
  sub?: string | undefined;
  size?: string | undefined;
  color?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  sort?: "recentes" | "menor" | "maior" | "nome" | undefined;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function filterProducts(list: Product[], f: ProductFilters) {
  let out = list.filter((p) => {
    if (f.q && !norm(`${p.name} ${p.description}`).includes(norm(f.q))) return false;
    if (f.group && p.groupId !== f.group) return false;
    if (f.sub && p.subcategoryId !== f.sub) return false;
    if (f.size && !p.sizes.includes(f.size)) return false;
    if (f.color && !p.colors.some((c) => c.name === f.color)) return false;
    const price = effectivePrice(p);
    if (f.min != null && price < f.min) return false;
    if (f.max != null && price > f.max) return false;
    return true;
  });
  const s = f.sort ?? "recentes";
  out = [...out].sort((a, b) =>
    s === "menor"
      ? effectivePrice(a) - effectivePrice(b)
      : s === "maior"
        ? effectivePrice(b) - effectivePrice(a)
        : s === "nome"
          ? a.name.localeCompare(b.name, "pt-BR")
          : b.createdAt.localeCompare(a.createdAt),
  );
  return out;
}
