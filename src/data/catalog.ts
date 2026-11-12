import type { CategoryGroup, Product } from "@/types/catalog";

export function findCategoryBySlug(slug: string, categories: CategoryGroup[]) {
  for (const group of categories) {
    if (group.slug === slug) return { group, sub: undefined };
    const sub = group.subcategories.find((s) => s.slug === slug);
    if (sub) return { group, sub };
  }
  return undefined;
}

export function getProductBySlug(slug: string, products: Product[]) {
  return products.find((p) => p.slug === slug);
}

export const effectivePrice = (p: Pick<Product, "price" | "promoPrice">) =>
  p.promoPrice != null && p.promoPrice < p.price ? p.promoPrice : p.price;
export const isOnSale = (p: Product) => p.promoPrice != null && p.promoPrice < p.price;
export const isNew = (p: Product, now = new Date()) => {
  const age = (now.getTime() - new Date(p.createdAt).getTime()) / 86400000;
  return age >= 0 && age <= 30;
};
export const getNewest = (products: Product[], n = 4) =>
  [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, n);
export const getFeatured = (products: Product[], n = 4) =>
  products.filter((p) => p.featured).slice(0, n);
export const getOnSale = (products: Product[]) => products.filter(isOnSale);

export function getRelated(p: Product, products: Product[], n = 4) {
  const same = products.filter((x) => x.id !== p.id && x.subcategoryId === p.subcategoryId);
  const group = products.filter(
    (x) => x.id !== p.id && x.groupId === p.groupId && !same.includes(x),
  );
  return [...same, ...group].slice(0, n);
}

export function categoryName(id: string, categories: CategoryGroup[]) {
  for (const g of categories) {
    if (g.id === id) return g.name;
    const sub = g.subcategories.find((s) => s.id === id);
    if (sub) return sub.name;
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
