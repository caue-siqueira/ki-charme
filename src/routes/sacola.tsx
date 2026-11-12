import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/format";
import { cartMessage } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

export const Route = createFileRoute("/sacola")({
  head: () => ({
    meta: [
      { title: "Sacola — Ki Charme" },
      { name: "description", content: "Revise suas peças e finalize o pedido pelo WhatsApp." },
      { property: "og:title", content: "Sacola — Ki Charme" },
      { property: "og:description", content: "Revise suas peças e finalize pelo WhatsApp." },
    ],
  }),
  component: Sacola,
});

function Sacola() {
  const { items, subtotal, setQty, remove } = useCart();
  if (!items.length)
    return (
      <div className="container-site py-20 text-center">
        <h1 className="text-4xl">Sua sacola está vazia</h1>
        <p className="mt-3 text-muted-foreground">
          Explore o catálogo e escolha suas peças favoritas.
        </p>
        <Link
          to="/catalogo"
          className="mt-8 inline-flex min-h-12 items-center rounded-md bg-primary px-8 font-semibold text-primary-foreground"
        >
          Ver catálogo
        </Link>
      </div>
    );
  return (
    <div className="container-site py-10">
      <h1 className="text-4xl md:text-5xl">Sacola</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-border rounded-lg bg-card">
          {items.map((i) => (
            <li
              key={`${i.productId}${i.size}${i.color}`}
              className="flex flex-wrap items-center gap-4 p-5"
            >
              <div
                className="h-24 w-18 shrink-0 rounded-md bg-placeholder"
                aria-hidden
                style={{ width: "4.5rem" }}
              />
              <div className="min-w-40 flex-1">
                <Link
                  to="/produto/$slug"
                  params={{ slug: i.slug }}
                  className="font-semibold hover:underline"
                >
                  {i.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {[i.size && `Tamanho ${i.size}`, i.color && `Cor ${i.color}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1">{formatBRL(i.price)}</p>
              </div>
              <div className="flex items-center rounded-md border border-input">
                <button
                  aria-label="Diminuir quantidade"
                  onClick={() => setQty(i, i.quantity - 1)}
                  className="flex h-11 w-11 items-center justify-center"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center" aria-live="polite">
                  {i.quantity}
                </span>
                <button
                  aria-label="Aumentar quantidade"
                  onClick={() => setQty(i, i.quantity + 1)}
                  className="flex h-11 w-11 items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => remove(i)}
                aria-label={`Remover ${i.name}`}
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-lg bg-card p-6 shadow-soft">
          <div className="flex justify-between text-lg">
            <span>Subtotal</span>
            <strong>{formatBRL(subtotal)}</strong>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Disponibilidade e valores sujeitos à confirmação pela loja.
          </p>
          <WhatsAppButton
            className="mt-6 w-full"
            label="Finalizar pelo WhatsApp"
            message={() => cartMessage(items)}
          />
          <Link
            to="/catalogo"
            className="mt-3 flex min-h-12 items-center justify-center font-semibold text-primary hover:underline"
          >
            Continuar comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
