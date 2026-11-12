import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, ChevronDown } from "lucide-react";
import { useState, type FormEvent } from "react";
import { usePublicCatalog } from "@/data/public-catalog";
import { useStoreSettings } from "@/data/store-settings";
import { useCart } from "@/lib/cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Logo } from "./Logo";
import { openWhatsApp } from "./WhatsAppButton";

function SearchBox({ onDone }: { onDone?: () => void }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/catalogo", search: { q: q.trim() || undefined } });
    onDone?.();
  };
  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <label htmlFor="busca" className="sr-only">
        Pesquisar produtos
      </label>
      <input
        id="busca"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar peças…"
        className="h-11 w-full rounded-full border border-input bg-card pl-4 pr-11 text-base outline-none focus:border-primary"
      />
      <button
        type="submit"
        aria-label="Pesquisar"
        className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-accent"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
}

function CartLink() {
  const { count } = useCart();
  return (
    <Link
      to="/sacola"
      className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-accent"
      aria-label={`Sacola, ${count} ${count === 1 ? "item" : "itens"}`}
    >
      <ShoppingBag className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader() {
  const s = useStoreSettings();
  const waGreeting = () => `Olá! Vim pelo site da ${s.name} e gostaria de atendimento.`;
  const { categories: groups } = usePublicCatalog();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-site flex h-20 items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-accent lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[88%] max-w-sm overflow-y-auto bg-background">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo compact />
              </SheetTitle>
            </SheetHeader>
            <div className="px-4">
              <SearchBox onDone={() => setOpen(false)} />
            </div>
            <nav className="px-4 pb-8" aria-label="Menu principal">
              <Link to="/" onClick={() => setOpen(false)} className="block py-3 text-lg">
                Início
              </Link>
              <Link to="/catalogo" onClick={() => setOpen(false)} className="block py-3 text-lg">
                Ver todo o catálogo
              </Link>
              <Accordion type="single" collapsible>
                {groups.map((g) => (
                  <AccordionItem key={g.id} value={g.id}>
                    <AccordionTrigger className="text-lg font-normal">{g.name}</AccordionTrigger>
                    <AccordionContent>
                      <Link
                        to="/categoria/$slug"
                        params={{ slug: g.slug }}
                        onClick={() => setOpen(false)}
                        className="block py-2.5 font-semibold text-primary"
                      >
                        Ver tudo
                      </Link>
                      {g.subcategories.map((s) => (
                        <Link
                          key={s.id}
                          to="/categoria/$slug"
                          params={{ slug: s.slug }}
                          onClick={() => setOpen(false)}
                          className="block py-2.5 text-base"
                        >
                          {s.name}
                        </Link>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Link to="/sobre" onClick={() => setOpen(false)} className="block py-3 text-lg">
                Sobre a loja
              </Link>
              <button
                onClick={() => openWhatsApp(waGreeting(), s.whatsappNumber)}
                className="mt-4 w-full rounded-md bg-primary py-3 font-semibold text-primary-foreground"
              >
                Falar no WhatsApp
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        <Logo />

        <nav className="ml-8 hidden items-center gap-1 lg:flex" aria-label="Menu principal">
          <Link
            to="/"
            className="rounded-md px-3 py-2 hover:bg-accent"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-primary" }}
          >
            Início
          </Link>
          <Popover open={mega} onOpenChange={setMega}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-3 py-2 hover:bg-accent"
              >
                Categorias <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent
              aria-label="Categorias da loja"
              align="center"
              sideOffset={20}
              collisionPadding={16}
              className="max-h-[calc(100dvh-6rem)] w-[calc(100vw-2rem)] max-w-7xl overflow-y-auto bg-card p-0 text-foreground shadow-soft"
            >
              <div className="grid grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-8">
                {groups.map((g) => (
                  <div key={g.id}>
                    <Link
                      to="/categoria/$slug"
                      params={{ slug: g.slug }}
                      onClick={() => setMega(false)}
                      className="font-display text-xl text-primary hover:underline"
                    >
                      {g.name}
                    </Link>
                    <ul className="mt-3 space-y-2">
                      {g.subcategories.map((s) => (
                        <li key={s.id}>
                          <Link
                            to="/categoria/$slug"
                            params={{ slug: s.slug }}
                            onClick={() => setMega(false)}
                            className="text-sm hover:text-primary"
                          >
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Link
            to="/catalogo"
            className="rounded-md px-3 py-2 hover:bg-accent"
            activeProps={{ className: "text-primary" }}
          >
            Catálogo
          </Link>
          <Link
            to="/sobre"
            className="rounded-md px-3 py-2 hover:bg-accent"
            activeProps={{ className: "text-primary" }}
          >
            Sobre
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-64 md:block">
            <SearchBox />
          </div>
          <button
            onClick={() => openWhatsApp(waGreeting(), s.whatsappNumber)}
            className="hidden min-h-11 rounded-full border border-primary px-4 text-sm font-semibold text-primary hover:bg-accent sm:block"
          >
            WhatsApp
          </button>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
