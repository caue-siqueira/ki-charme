import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminGetProduct, adminListCategories } from "@/data/admin.functions";
import { AdminShell, AdminLoading, AdminError } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/produtos/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar peça — Ki Charme" },
      { name: "description", content: "Ajustar uma peça da loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const product = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => adminGetProduct({ data: { id } }),
  });
  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminListCategories(),
  });

  if (product.isPending || categories.isPending) {
    return (
      <AdminShell title="Editar peça">
        <AdminLoading />
      </AdminShell>
    );
  }
  if (product.error) {
    return (
      <AdminShell title="Editar peça">
        <AdminError text={String(product.error.message)} />
      </AdminShell>
    );
  }
  if (!product.data) {
    return (
      <AdminShell title="Editar peça">
        <div className="rounded-lg bg-card p-8 text-center">
          <p className="font-display text-2xl">Esta peça não existe mais</p>
          <Link
            to="/admin/produtos"
            className="mt-4 inline-block font-semibold text-primary underline"
          >
            Voltar para a lista
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Editar peça" intro={product.data.name}>
      <ProductForm
        initial={product.data}
        categories={categories.data ?? []}
        onSaved={() => navigate({ to: "/admin/produtos" })}
      />
    </AdminShell>
  );
}
