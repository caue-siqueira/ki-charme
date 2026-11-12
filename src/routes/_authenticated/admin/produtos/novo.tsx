import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminListCategories } from "@/data/admin.functions";
import { AdminShell, AdminLoading } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/produtos/novo")({
  head: () => ({
    meta: [
      { title: "Nova peça — Ki Charme" },
      { name: "description", content: "Cadastrar uma peça nova na loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminListCategories(),
  });

  return (
    <AdminShell
      title="Nova peça"
      intro="Preencha o que souber agora — dá para voltar e completar depois."
    >
      {categories.isPending ? (
        <AdminLoading />
      ) : (
        <ProductForm
          categories={categories.data ?? []}
          onSaved={() => navigate({ to: "/admin/produtos" })}
        />
      )}
    </AdminShell>
  );
}
