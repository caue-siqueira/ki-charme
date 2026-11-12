import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminDeleteProduct,
  adminDuplicateProduct,
  adminListProducts,
} from "@/data/admin.functions";
import { AdminShell, AdminLoading, AdminError } from "@/components/admin/AdminShell";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { formatBRL } from "@/lib/format";
import type { ProductStatus } from "@/types/catalog";

export const Route = createFileRoute("/_authenticated/admin/produtos/")({
  head: () => ({
    meta: [
      { title: "Peças — Ki Charme" },
      { name: "description", content: "Lista de peças da loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProducts,
});

const STATUS_LABEL: Record<ProductStatus, string> = {
  published: "Publicada",
  sold_out: "Esgotada",
  hidden: "Oculta",
};

const STATUS_STYLE: Record<ProductStatus, string> = {
  published: "bg-primary/10 text-primary",
  sold_out: "bg-secondary text-foreground",
  hidden: "bg-muted text-muted-foreground",
};

function AdminProducts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const products = useQuery({
    queryKey: ["admin", "products", q],
    queryFn: () => adminListProducts({ data: { q } }),
  });

  const duplicate = async (id: string) => {
    try {
      const { id: newId } = await adminDuplicateProduct({ data: { id } });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Cópia criada e escondida. Ajuste e publique quando quiser.");
      navigate({ to: "/admin/produtos/$id/editar", params: { id: newId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível copiar.");
    }
  };

  const remove = async (id: string, name: string) => {
    try {
      await adminDeleteProduct({ data: { id } });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success(`“${name}” foi apagada.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível apagar.");
    }
  };

  return (
    <AdminShell
      title="Peças"
      intro="Edite preços, fotos e a situação de cada peça."
      actions={
        <Link
          to="/admin/produtos/novo"
          className="min-h-12 rounded-md bg-primary px-5 font-semibold text-primary-foreground"
        >
          Adicionar peça
        </Link>
      }
    >
      <label className="block max-w-md">
        <span className="mb-1 block font-semibold">Buscar por nome</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ex.: vestido"
          className="min-h-12 w-full rounded-md border border-input bg-card px-4 text-base"
        />
      </label>

      {products.isPending && (
        <div className="mt-6">
          <AdminLoading />
        </div>
      )}
      {products.error && (
        <div className="mt-6">
          <AdminError text={String(products.error.message)} />
        </div>
      )}

      {products.data && products.data.length === 0 && (
        <div className="mt-6 rounded-lg bg-card p-8 text-center">
          <p className="font-display text-2xl">Nenhuma peça ainda</p>
          <p className="mt-2 text-muted-foreground">Comece adicionando a primeira peça da loja.</p>
          <Link
            to="/admin/produtos/novo"
            className="mt-5 inline-flex min-h-12 items-center rounded-md bg-primary px-6 font-semibold text-primary-foreground"
          >
            Adicionar peça
          </Link>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {(products.data ?? []).map((p) => (
          <li key={p.id} className="rounded-lg bg-card p-4 sm:flex sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{p.name}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[p.status]}`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
                {p.featured && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                    Destaque
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatBRL(p.promoPrice ?? p.price)}
                {p.promoPrice !== null && ` · de ${formatBRL(p.price)}`}
                {" · "}
                {p.photos.length} {p.photos.length === 1 ? "foto" : "fotos"}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
              <Link
                to="/admin/produtos/$id/editar"
                params={{ id: p.id }}
                className="min-h-11 rounded-md border border-primary px-4 text-sm font-semibold text-primary"
              >
                Editar
              </Link>
              <button
                onClick={() => duplicate(p.id)}
                className="min-h-11 rounded-md border border-input px-4 text-sm font-semibold hover:bg-accent"
              >
                Duplicar
              </button>
              <ConfirmDialog
                title={`Apagar “${p.name}”?`}
                description="A peça sai do site e da lista. Essa ação não pode ser desfeita."
                trigger={
                  <button className="min-h-11 rounded-md border border-destructive px-4 text-sm font-semibold text-destructive">
                    Apagar
                  </button>
                }
                onConfirm={() => remove(p.id, p.name)}
              />
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
