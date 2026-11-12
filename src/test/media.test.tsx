import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { photoUrl } from "@/lib/media";
import { ProductImage } from "@/components/site/ProductImage";
import { makeProduct } from "./catalog-fixtures";

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubEnv("VITE_SUPABASE_URL", "https://store.supabase.co/");
});
afterEach(() => vi.unstubAllEnvs());

describe("Fotos da loja", () => {
  it("normaliza caminhos e evita duplicar o bucket e a codificação", () => {
    const expected =
      "https://store.supabase.co/storage/v1/object/public/product-photos/products/foto%20real.jpg";
    expect(photoUrl("products/foto real.jpg")).toBe(expected);
    expect(photoUrl("/product-photos/products/foto%20real.jpg")).toBe(expected);
    expect(photoUrl(expected)).toBe(expected);
  });
  it("preserva URLs assinadas completas e não gera endereço para caminho vazio", () => {
    const signed =
      "https://store.supabase.co/storage/v1/object/sign/product-photos/products/x.jpg?token=teste";
    expect(photoUrl(signed)).toBe(signed);
    expect(photoUrl("")).toBe("");
  });
  it("trata falha da imagem e tenta novamente quando o caminho muda", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () =>
        root.render(
          <ProductImage
            product={makeProduct({ images: [{ url: "/foto-antiga.jpg", alt: "Foto" }] })}
          />,
        ),
      );
      await act(async () => container.querySelector("img")!.dispatchEvent(new Event("error")));
      expect(container).toHaveTextContent("Foto indisponível");
      expect(container.querySelector("img")).toBeNull();
      await act(async () =>
        root.render(
          <ProductImage
            product={makeProduct({ images: [{ url: "/foto-nova.jpg", alt: "Foto nova" }] })}
          />,
        ),
      );
      expect(container.querySelector("img")).toHaveAttribute("src", "/foto-nova.jpg");
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
