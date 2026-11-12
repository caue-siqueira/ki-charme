// Área da loja: tudo aqui exige sessão válida E o papel de administrador
// confirmado no banco. Esconder a tela não é autorização.
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { uniqueSlug } from "@/lib/slug";
import { parseMoney } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";
import {
  toColors,
  type CategoryRow,
  type ProductImageRow,
  type ProductRow,
  type SettingsRow,
} from "./mappers";
import type { ProductColor, ProductStatus } from "@/types/catalog";

type ProductWithImagesRow = ProductRow & { product_images: ProductImageRow[] | null };

export interface AdminPhoto {
  storagePath: string;
  altText: string;
  order: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  promoPrice: number | null;
  categoryId: string;
  sizes: string[];
  colors: ProductColor[];
  status: ProductStatus;
  featured: boolean;
  measurements: string | null;
  photos: AdminPhoto[];
  createdAt: string;
}

export interface SaveProductInput {
  id?: string | undefined;
  name: string;
  description: string;
  price: number | string;
  promoPrice: number | string | null;
  categoryId: string;
  sizes: string[];
  colors: ProductColor[];
  status: ProductStatus;
  featured: boolean;
  measurements: string | null;
  photos: string[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
}

async function requireAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error("Não foi possível confirmar suas permissões. Tente novamente.");
  if (!data) throw new Error("Somente a dona da loja pode entrar nesta área.");
}

function toAdminProduct(row: ProductWithImagesRow): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    promoPrice: row.promotional_price === null ? null : Number(row.promotional_price),
    categoryId: row.category_id,
    sizes: row.sizes ?? [],
    colors: toColors(row.colors),
    status: row.status as ProductStatus,
    featured: row.is_featured,
    measurements: row.measurements,
    photos: (row.product_images ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order)
      .map((img) => ({
        storagePath: img.storage_path,
        altText: img.alt_text,
        order: img.display_order,
      })),
    createdAt: row.created_at,
  };
}

const byOrder = (
  a: { display_order: number; name: string },
  b: { display_order: number; name: string },
) => a.display_order - b.display_order || a.name.localeCompare(b.name, "pt-BR");

void byOrder;

// ---------- Painel ----------

export const adminGetOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const count = async (filter?: ProductStatus | "featured") => {
      let q = context.supabase.from("products").select("*", { count: "exact", head: true });
      if (filter === "featured") q = q.eq("is_featured", true);
      else if (filter) q = q.eq("status", filter);
      const { count: n, error } = await q;
      if (error) throw new Error(error.message);
      return n ?? 0;
    };
    const [total, published, soldOut, hidden, featured, categories] = await Promise.all([
      count(),
      count("published"),
      count("sold_out"),
      count("hidden"),
      count("featured"),
      context.supabase.from("categories").select("id", { count: "exact", head: true }),
    ]);
    return {
      total,
      published,
      soldOut,
      hidden,
      featured,
      categories: categories.count ?? 0,
    };
  });

// ---------- Peças ----------

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { q?: string | undefined }) => input)
  .handler(async ({ data, context }): Promise<AdminProduct[]> => {
    await requireAdmin(context.supabase, context.userId);
    let query = context.supabase
      .from("products")
      .select("*, product_images(*)")
      .order("created_at", { ascending: false });
    if (data.q && data.q.trim()) {
      query = query.ilike("name", `%${data.q.trim()}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((row) => toAdminProduct(row as unknown as ProductWithImagesRow));
  });

export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }): Promise<AdminProduct | null> => {
    await requireAdmin(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? toAdminProduct(row as unknown as ProductWithImagesRow) : null;
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SaveProductInput) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);

    const name = data.name.trim();
    if (!name) throw new Error("Dê um nome para a peça.");
    const price = parseMoney(data.price);
    if (!Number.isFinite(price) || price <= 0) throw new Error("Informe um preço maior que zero.");

    let promo: number | null = null;
    const rawPromo = data.promoPrice;
    if (rawPromo !== null && rawPromo !== undefined && `${rawPromo}`.trim() !== "") {
      promo = parseMoney(rawPromo);
      if (!Number.isFinite(promo) || promo <= 0)
        throw new Error("O preço promocional precisa ser maior que zero.");
      if (promo >= price) throw new Error("A promoção precisa ser menor que o preço normal.");
    }

    if (!data.categoryId) throw new Error("Escolha uma categoria.");
    const { data: category, error: catError } = await context.supabase
      .from("categories")
      .select("id")
      .eq("id", data.categoryId)
      .maybeSingle();
    if (catError) throw new Error(catError.message);
    if (!category) throw new Error("A categoria escolhida não existe mais.");

    let slugQuery = context.supabase.from("products").select("slug");
    if (data.id) slugQuery = slugQuery.neq("id", data.id);
    const { data: slugRows, error: slugError } = await slugQuery;
    if (slugError) throw new Error(slugError.message);
    const slug = uniqueSlug(
      name,
      (slugRows ?? []).map((r) => r.slug),
    );

    const payload = {
      name,
      slug,
      description: data.description.trim(),
      price,
      promotional_price: promo,
      category_id: data.categoryId,
      sizes: data.sizes,
      colors: data.colors.map((c) => ({ name: c.name, swatch: c.swatch })),
      status: data.status,
      is_featured: data.featured,
      measurements: data.measurements?.trim() ? data.measurements.trim() : null,
    };

    let id = data.id;
    if (id) {
      const { error } = await context.supabase.from("products").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await context.supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      id = created.id;
    }

    const { error: clearError } = await context.supabase
      .from("product_images")
      .delete()
      .eq("product_id", id);
    if (clearError) throw new Error(clearError.message);

    if (data.photos.length) {
      const rows = data.photos.map((storagePath, index) => ({
        product_id: id as string,
        storage_path: storagePath,
        display_order: index,
        alt_text: name,
      }));
      const { error: insertError } = await context.supabase.from("product_images").insert(rows);
      if (insertError) throw new Error(insertError.message);
    }

    return { id: id as string };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// A cópia nasce oculta: a dona ajusta e publica quando quiser.
export const adminDuplicateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data: original, error } = await context.supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!original) throw new Error("A peça que você quer copiar não existe mais.");

    const row = original as unknown as ProductWithImagesRow;
    const { data: slugRows } = await context.supabase.from("products").select("slug");
    const slug = uniqueSlug(
      `${row.name} copia`,
      (slugRows ?? []).map((r) => r.slug),
    );

    const { data: created, error: insertError } = await context.supabase
      .from("products")
      .insert({
        name: `${row.name} (cópia)`,
        slug,
        description: row.description,
        price: row.price,
        promotional_price: row.promotional_price,
        category_id: row.category_id,
        sizes: row.sizes,
        colors: row.colors,
        status: "hidden",
        is_featured: false,
        measurements: row.measurements,
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    const images = (row.product_images ?? [])
      .slice()
      .sort((a, b) => a.display_order - b.display_order);
    if (images.length) {
      const { error: imgError } = await context.supabase.from("product_images").insert(
        images.map((img, index) => ({
          product_id: created.id,
          storage_path: img.storage_path,
          display_order: index,
          alt_text: img.alt_text,
        })),
      );
      if (imgError) throw new Error(imgError.message);
    }
    return { id: created.id };
  });

// ---------- Categorias ----------

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCategory[]> => {
    await requireAdmin(context.supabase, context.userId);
    const [cats, prods] = await Promise.all([
      context.supabase.from("categories").select("*").order("display_order").order("name"),
      context.supabase.from("products").select("category_id"),
    ]);
    if (cats.error) throw new Error(cats.error.message);
    const counts = new Map<string, number>();
    for (const p of prods.data ?? []) {
      counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
    }
    return (cats.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parent_id,
      displayOrder: c.display_order,
      isActive: c.is_active,
      productCount: counts.get(c.id) ?? 0,
    }));
  });

export const adminCreateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; parentId?: string | undefined }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const name = data.name.trim();
    if (!name) throw new Error("Escreva o nome da categoria.");

    const { data: existing, error } = await context.supabase
      .from("categories")
      .select("slug, parent_id, display_order");
    if (error) throw new Error(error.message);
    const rows = (existing ?? []) as CategoryRow[];
    const slug = uniqueSlug(
      name,
      rows.map((r) => r.slug),
    );
    const sameLevel = rows.filter((r) => (r.parent_id ?? null) === (data.parentId ?? null));
    const nextOrder = sameLevel.length ? Math.max(...sameLevel.map((r) => r.display_order)) + 1 : 1;

    const { error: insertError } = await context.supabase
      .from("categories")
      .insert({ name, slug, parent_id: data.parentId ?? null, display_order: nextOrder });
    if (insertError) {
      if (insertError.message.includes("subcategoria")) {
        throw new Error(
          "Só é permitido um nível de subcategoria. Escolha uma categoria principal.",
        );
      }
      throw new Error(insertError.message);
    }
    return { ok: true };
  });

export const adminUpdateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      name?: string | undefined;
      isActive?: boolean | undefined;
      displayOrder?: number | undefined;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const payload: Database["public"]["Tables"]["categories"]["Update"] = {};
    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new Error("O nome não pode ficar vazio.");
      payload["name"] = name;
    }
    if (data.isActive !== undefined) payload["is_active"] = data.isActive;
    if (data.displayOrder !== undefined) payload["display_order"] = data.displayOrder;
    if (!Object.keys(payload).length) return { ok: true };
    const { error } = await context.supabase.from("categories").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data: children, error: childError } = await context.supabase
      .from("categories")
      .select("id")
      .eq("parent_id", data.id);
    if (childError) throw new Error(childError.message);
    const ids = [data.id, ...(children ?? []).map((c) => c.id)];

    const { data: used, error: usedError } = await context.supabase
      .from("products")
      .select("id")
      .in("category_id", ids);
    if (usedError) throw new Error(usedError.message);
    if (used && used.length) {
      throw new Error(
        `Esta categoria tem ${used.length} ${used.length === 1 ? "peça" : "peças"}. Mova as peças antes de excluir.`,
      );
    }
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Configurações ----------

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SettingsRow | null> => {
    await requireAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("store_settings")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data ?? null) as SettingsRow | null;
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      storeName: string;
      subtitle: string;
      whatsappNumber: string;
      instagramUrl: string;
      address: string;
      openingHours: string;
      pickupInformation: string;
      exchangePolicy: string;
      about: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const storeName = data.storeName.trim();
    if (!storeName) throw new Error("O nome da loja não pode ficar vazio.");
    const number = data.whatsappNumber.replace(/\D/g, "");
    if (number && number.length < 10) {
      throw new Error("O número do WhatsApp precisa ter o DDD, ex.: 5511999999999.");
    }
    const { error } = await context.supabase
      .from("store_settings")
      .update({
        store_name: storeName,
        subtitle: data.subtitle.trim(),
        whatsapp_number: number,
        instagram_url: data.instagramUrl.trim() || null,
        address: data.address.trim() || null,
        opening_hours: data.openingHours.trim() || null,
        pickup_information: data.pickupInformation.trim() || null,
        exchange_policy: data.exchangePolicy.trim() || null,
        about: data.about.trim() || null,
      })
      .eq("id", "00000000-0000-0000-0000-000000000001");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
