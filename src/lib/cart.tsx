import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/types/catalog";

const KEY = "kicharme-sacola";
const keyOf = (i: Pick<CartItem, "productId" | "size" | "color">) =>
  `${i.productId}|${i.size ?? ""}|${i.color ?? ""}`;

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  setQty: (item: CartItem, qty: number) => void;
  remove: (item: CartItem) => void;
  clear: () => void;
}
const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
      add: (item) =>
        setItems((prev) => {
          const k = keyOf(item);
          const found = prev.find((p) => keyOf(p) === k);
          return found
            ? prev.map((p) => (keyOf(p) === k ? { ...p, quantity: p.quantity + item.quantity } : p))
            : [...prev, item];
        }),
      setQty: (item, qty) =>
        setItems((prev) =>
          prev.map((p) =>
            keyOf(p) === keyOf(item) ? { ...p, quantity: Math.max(1, Math.min(99, qty)) } : p,
          ),
        ),
      remove: (item) => setItems((prev) => prev.filter((p) => keyOf(p) !== keyOf(item))),
      clear: () => setItems([]),
    }),
    [items],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
