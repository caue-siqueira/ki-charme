import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
  type AdminCategory,
} from "@/data/admin.functions";
import { AdminShell, AdminLoading, AdminError } from "@/components/admin/AdminShell";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Ki Charme" },
      { name: "description", content: "Organizar as categorias do catálogo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCategories,
});

const field = "min-h-12 w-full rounded-md border border-input bg-card px-4 text-base";

function Row({ cat, onDone }: { cat: AdminCategory; onDone: () => void }) {
  const [name, setName] = useState(cat.name);

  const save = async (patch: { name?: string; isActive?: boolean; displayOrder?: number }) => {
    try {
      await adminUpdateCategory({ data: { id: cat.id, ...patch } });
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  const drop = async () => {
    try {
      await adminDeleteCategory({ data: { id: cat.id } });
      toast.success("Categoria apagada.");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível apagar.");
    }
  };

  return (
    <li className="rounded-lg bg-card p-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-40 flex-1">
          <span className="mb-1 block text-sm font-semibold">Nome</span>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name.trim() !== cat.name) save({ name });
            }}
          />
        </label>
        <label className="w-24">
          <span className="mb-1 block text-sm font-semibold">Ordem</span>
          <input
            className={field}
            type="number"
            value={cat.displayOrder}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n !== cat.displayOrder) save({ displayOrder: n });
            }}
          />
        </label>
        <button
          onClick={() => save({ isActive: !cat.isActive })}
          className={`min-h-12 rounded-md border px-4 text-sm font-semibold ${cat.isActive ? "border-primary text-primary" : "border-input text-muted-foreground"}`}
        >
          {cat.isActive ? "Aparece no site" : "Escondida"}
        </button>
        <ConfirmDialog
          title={`Apagar “${cat.name}”?`}
          description={
            cat.productCount > 0
              ? `Esta categoria tem ${cat.productCount} ${cat.productCount === 1 ? "peça" : "peças"}. Mova as peças antes de apagar.`
              : "A categoria sai do menu do site. Essa ação não pode ser desfeita."
          }
          trigger={
            <button className="min-h-12 rounded-md border border-destructive px-4 text-sm font-semibold text-destructive">
              Apagar
            </button>
          }
          onConfirm={drop}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {cat.productCount} {cat.productCount === 1 ? "peça" : "peças"} · endereço: /categoria/
        {cat.slug}
      </p>
    </li>
  );
}

function AddForm({
  parentId,
  label,
  onDone,
}: {
  parentId?: string;
  label: string;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const submit = async () => {
    if (!name.trim()) return;
    try {
      await adminCreateCategory({ data: { name, parentId } });
      setName("");
      toast.success("Categoria criada.");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível criar.");
    }
  };
  return (
    <div className="flex gap-2">
      <input
        className={field}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={label}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button
        onClick={submit}
        className="min-h-12 shrink-0 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
      >
        Criar
      </button>
    </div>
  );
}

function AdminCategories() {
  const queryClient = useQueryClient();
  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminListCategories(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
  };

  if (categories.isPending)
    return (
      <AdminShell title="Categorias">
        <AdminLoading />
      </AdminShell>
    );
  if (categories.error)
    return (
      <AdminShell title="Categorias">
        <AdminError text={String(categories.error.message)} />
      </AdminShell>
    );

  const all = categories.data ?? [];
  const groups = all.filter((c) => !c.parentId).sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <AdminShell
      title="Categorias"
      intro="São elas que aparecem no menu do site. Você pode criar quantas quiser."
    >
      <div className="max-w-md">
        <h2 className="mb-2 text-xl">Nova categoria principal</h2>
        <AddForm label="Ex.: Moda praia" onDone={refresh} />
      </div>

      <ul className="mt-8 space-y-6">
        {groups.map((g) => (
          <li key={g.id}>
            <Row cat={g} onDone={refresh} />
            <ul className="mt-3 space-y-2 border-l-2 border-border pl-4">
              {all
                .filter((s) => s.parentId === g.id)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((s) => (
                  <Row key={s.id} cat={s} onDone={refresh} />
                ))}
            </ul>
            <div className="mt-3 max-w-md border-l-2 border-border pl-4">
              <AddForm parentId={g.id} label={`Nova subcategoria em ${g.name}`} onDone={refresh} />
            </div>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
