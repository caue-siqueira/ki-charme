// Moldura de todas as telas da área da loja: títulos grandes, botões altos,
// navegação que funciona bem no celular.
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Painel", exact: true },
  { to: "/admin/produtos", label: "Peças", exact: false },
  { to: "/admin/categorias", label: "Categorias", exact: false },
  { to: "/admin/configuracoes", label: "Configurações", exact: false },
] as const;

export function AdminShell({
  title,
  intro,
  actions,
  children,
}: {
  title: string;
  intro?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container-site flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
          <span className="font-display text-2xl italic text-primary">Ki Charme</span>
          <span className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
            Área da loja
          </span>
          <button
            onClick={signOut}
            className="ml-auto min-h-10 rounded-full border border-input px-4 text-sm font-semibold hover:bg-accent"
          >
            Sair
          </button>
        </div>
        <nav aria-label="Menus da loja" className="container-site flex gap-1 overflow-x-auto pb-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="inline-flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="container-site py-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl">{title}</h1>
            {intro && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{intro}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        <div className={cn("mt-5")}>{children}</div>
      </main>
    </div>
  );
}

export const adminButton =
  "min-h-12 rounded-md bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90";
export const adminOutline =
  "min-h-12 rounded-md border border-primary px-5 font-semibold text-primary hover:bg-accent";

export function AdminLoading({ text = "Carregando…" }: { text?: string }) {
  return (
    <div role="status" className="rounded-lg bg-card px-6 py-12 text-center text-muted-foreground">
      {text}
    </div>
  );
}

export function AdminError({ text }: { text: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg bg-destructive/10 px-6 py-8 text-center font-semibold text-destructive"
    >
      {text}
    </div>
  );
}
