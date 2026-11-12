import type { CartItem } from "@/types/catalog";
import { formatBRL } from "./format";

export const sanitizeNumber = (n: string) => n.replace(/\D/g, "");

export function waLink(number: string, message: string): string | null {
  const n = sanitizeNumber(number);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export function productMessage(p: {
  name: string;
  size?: string | undefined;
  color?: string | undefined;
  price: number;
  url: string;
}) {
  return [
    "Olá! Vi esta peça no site da Ki Charme e gostaria de consultar a disponibilidade:",
    "",
    `Produto: ${p.name}`,
    p.size ? `Tamanho: ${p.size}` : null,
    p.color ? `Cor: ${p.color}` : null,
    `Preço anunciado: ${formatBRL(p.price)}`,
    `Link: ${p.url}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export function cartMessage(items: CartItem[]) {
  const lines = items.map(
    (i, idx) =>
      `${idx + 1}. ${i.name}\n   Qtd: ${i.quantity}${i.size ? ` | Tamanho: ${i.size}` : ""}${i.color ? ` | Cor: ${i.color}` : ""}\n   ${formatBRL(i.price * i.quantity)}`,
  );
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return [
    "Olá! Montei uma sacola no site da Ki Charme e gostaria de consultar a disponibilidade:",
    "",
    ...lines,
    "",
    `Subtotal: ${formatBRL(subtotal)}`,
  ].join("\n");
}
