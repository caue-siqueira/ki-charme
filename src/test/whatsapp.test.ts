import { describe, expect, it } from "vitest";
import { waLink, productMessage } from "@/lib/whatsapp";
import { filterProducts } from "@/data/catalog";
import { makeProduct } from "./catalog-fixtures";

describe("whatsapp", () => {
  it("returns no link while number is not configured", () => {
    expect(waLink("", "oi")).toBeNull();
  });
  it("builds wa.me link with encoded message", () => {
    expect(waLink("+55 (11) 99999-0000", "Olá mundo")).toBe(
      "https://wa.me/5511999990000?text=Ol%C3%A1%20mundo",
    );
  });
  it("product message includes size and price in BRL", () => {
    const m = productMessage({ name: "Vestido Floral", size: "M", price: 129.9, url: "x" });
    expect(m).toContain("Tamanho: M");
    expect(m).toContain("Preço anunciado: R$ 129,90");
  });
});

describe("catalog", () => {
  it("sorts by lowest effective price", () => {
    const r = filterProducts(
      [
        makeProduct({ id: "normal", price: 200 }),
        makeProduct({ id: "promo", price: 300, promoPrice: 50 }),
      ],
      { sort: "menor" },
    );
    expect(r[0]?.id).toBe("promo");
  });
});
