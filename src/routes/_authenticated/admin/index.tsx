import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminGetOverview } from "@/data/admin.functions";
import { AdminShell, AdminLoading, AdminError } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Painel da loja — Ki Charme" },
      { name: "description", content: "Resumo das peças da loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHome,
});

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={
        accent
          ? "rounded-xl bg-primary p-4 text-primary-foreground"
          : "rounded-xl border border-border bg-card p-4"
      }
    >
      <p
        className={
          accent
            ? "text-xs font-medium uppercase tracking-wider opacity-80"
            : "text-xs font-medium uppercase tracking-wider text-muted-foreground"
        }
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Action({
  to,
  title,
  text,
}: {
  to: "/admin/produtos/novo" | "/admin/produtos" | "/admin/categorias" | "/admin/configuracoes";
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary hover:bg-accent"
    >
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{text}</span>
      </span>
      <span
        aria-hidden
        className="text-xl text-primary transition-transform group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}

function AdminHome() {
  const overview = useQuery({ queryKey: ["admin", "overview"], queryFn: () => adminGetOverview() });

  if (overview.isPending)
    return (
      <AdminShell title="Painel">
        <AdminLoading />
      </AdminShell>
    );
  if (overview.error)
    return (
      <AdminShell title="Painel">
        <AdminError text={String(overview.error.message)} />
      </AdminShell>
    );
  const o = overview.data;

  return (
    <AdminShell title="Painel" intro="Um retrato rápido da loja hoje.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total" value={o.total} accent />
        <Stat label="Publicadas" value={o.published} />
        <Stat label="Esgotadas" value={o.soldOut} />
        <Stat label="Ocultas" value={o.hidden} />
        <Stat label="Destaques" value={o.featured} />
        <Stat label="Categorias" value={o.categories} />
      </div>

      <h2 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Atalhos
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <Action
          to="/admin/produtos/novo"
          title="Adicionar peça"
          text="Cadastre uma peça nova com fotos"
        />
        <Action to="/admin/produtos" title="Ver todas as peças" text="Editar, duplicar ou apagar" />
        <Action to="/admin/categorias" title="Categorias" text="Organize o catálogo" />
        <Action to="/admin/configuracoes" title="Configurações" text="WhatsApp, contato e senha" />
      </div>
    </AdminShell>
  );
}
