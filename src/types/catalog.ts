// Shared domain types. Stage 2 will map database rows to these shapes.
export type ProductStatus = "published" | "sold_out" | "hidden";

export interface ProductImage {
  url: string;
  alt: string;
}

export interface ProductColor {
  name: string;
  /** Optional swatch, any CSS color */
  swatch?: string | undefined;
}

export interface Subcategory {
  id: string;
  slug: string;
  name: string;
  order: number;
  visible: boolean;
}

export interface CategoryGroup {
  id: string;
  slug: string;
  name: string;
  order: number;
  visible: boolean;
  subcategories: Subcategory[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  promoPrice?: number | undefined;
  groupId: string;
  subcategoryId: string;
  images: ProductImage[];
  sizes: string[];
  colors: ProductColor[];
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
  measurements?: string | undefined;
  isDemo?: boolean | undefined;
}

export interface StoreSettings {
  name: string;
  tagline: string;
  whatsappNumber: string;
  instagram?: string | undefined;
  address?: string | undefined;
  hours?: string | undefined;
  exchangePolicy?: string | undefined;
  pickupInfo?: string | undefined;
  about: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  size?: string | undefined;
  color?: string | undefined;
  quantity: number;
}
