import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { filterProducts, type ProductFilters } from "@/data/catalog";
import { usePublicCatalog } from "@/data/public-catalog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductGrid } from "./ProductCard";

export type CatalogSearch = Omit<ProductFilters, "group" | "sub"> & {
  cat?: string | undefined;
  sub?: string | undefined;
};

export function parseCatalogSearch(s: Record<string, unknown>): CatalogSearch {
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const num = (v: unknown) => (v === "" || v == null || isNaN(Number(v)) ? undefined : Number(v));
  const sort = str(s["sort"]);
  return {
    q: str(s["q"]),
    cat: str(s["cat"]),
    sub: str(s["sub"]),
    size: str(s["size"]),
    color: str(s["color"]),
    min: num(s["min"]),
    max: num(s["max"]),
    sort:
      sort && ["recentes", "menor", "maior", "nome"].includes(sort)
        ? (sort as CatalogSearch["sort"])
        : undefined,
  };
}

const selectCls = "h-11 w-full rounded-md border border-input bg-card px-3 text-base";

export function CatalogView({
  title,
  intro,
  search,
  fixedGroup,
  fixedSub,
  onChange,
}: {
  title: string;
  intro?: string | undefined;
  search: CatalogSearch;
  fixedGroup?: string | undefined;
  fixedSub?: string | undefined;
  onChange: (next: CatalogSearch) => void;
}) {
  const { categories: groups, products: all } = usePublicCatalog();
  const group = fixedGroup ?? search.cat;
  const sub = fixedSub ?? search.sub;
  const scope = useMemo(() => filterProducts(all, { group, sub }), [all, group, sub]);
  const sizes = [...new Set(scope.flatMap((p) => p.sizes))];
  const colors = [...new Set(scope.flatMap((p) => p.colors.map((c) => c.name)))].sort();
  const results = filterProducts(all, { ...search, group, sub });
  const subs = groups.find((g) => g.id === group)?.subcategories ?? [];
  const set = (patch: Partial<CatalogSearch>) => onChange({ ...search, ...patch });
  const activeCount = [
    search.size,
    search.color,
    search.min,
    search.max,
    !fixedGroup && search.cat,
    !fixedSub && search.sub,
  ].filter((v) => v != null && v !== false && v !== "").length;
  const [open, setOpen] = useState(false);

  const filters = (
    <div className="space-y-5">
      {!fixedGroup && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Categoria</span>
          <select
            className={selectCls}
            value={search.cat ?? ""}
            onChange={(e) => set({ cat: e.target.value || undefined, sub: undefined })}
          >
            <option value="">Todas</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {!fixedSub && subs.length > 0 && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Subcategoria</span>
          <select
            className={selectCls}
            value={search.sub ?? ""}
            onChange={(e) => set({ sub: e.target.value || undefined })}
          >
            <option value="">Todas</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Tamanho</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={search.size === s}
                onClick={() => set({ size: search.size === s ? undefined : s })}
                className={`min-h-11 min-w-11 rounded-md border px-3 text-sm ${search.size === s ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {colors.length > 0 && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Cor</span>
          <select
            className={selectCls}
            value={search.color ?? ""}
            onChange={(e) => set({ color: e.target.value || undefined })}
          >
            <option value="">Todas</option>
            {colors.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      )}
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Faixa de preço (R$)</legend>
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            aria-label="Preço mínimo"
            placeholder="Mín."
            className={selectCls}
            defaultValue={search.min ?? ""}
            onBlur={(e) => set({ min: e.target.value ? Number(e.target.value) : undefined })}
          />
          <span>–</span>
          <input
            inputMode="numeric"
            aria-label="Preço máximo"
            placeholder="Máx."
            className={selectCls}
            defaultValue={search.max ?? ""}
            onBlur={(e) => set({ max: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </fieldset>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => onChange({ q: search.q, sort: search.sort })}
          className="min-h-11 text-sm font-semibold text-primary underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="container-site py-10">
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}
      {search.q && (
        <p className="mt-4 flex items-center gap-2">
          Resultados para “{search.q}”
          <button
            onClick={() => set({ q: undefined })}
            aria-label="Limpar pesquisa"
            className="rounded-full p-1 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </p>
      )}
      <div className="mt-8 flex gap-10">
        <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filtros">
          {filters}
        </aside>
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="flex min-h-11 items-center gap-2 rounded-md border border-input bg-card px-4 lg:hidden">
                <SlidersHorizontal className="h-5 w-5" /> Filtros
                {activeCount > 0 && ` (${activeCount})`}
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background"
              >
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-4">
                  {filters}
                  <button
                    onClick={() => setOpen(false)}
                    className="mt-6 min-h-12 w-full rounded-md bg-primary font-semibold text-primary-foreground"
                  >
                    Ver {results.length} {results.length === 1 ? "peça" : "peças"}
                  </button>
                </div>
              </SheetContent>
            </Sheet>
            <p className="hidden text-sm text-muted-foreground lg:block">
              {results.length} {results.length === 1 ? "peça" : "peças"}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only sm:not-sr-only">Ordenar por</span>
              <select
                className="h-11 rounded-md border border-input bg-card px-3"
                value={search.sort ?? "recentes"}
                onChange={(e) => set({ sort: e.target.value as CatalogSearch["sort"] })}
              >
                <option value="recentes">Mais recentes</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="nome">Nome</option>
              </select>
            </label>
          </div>
          {results.length ? (
            <ProductGrid products={results} />
          ) : (
            <div className="rounded-lg bg-card p-10 text-center">
              <p className="font-display text-2xl">Nenhuma peça encontrada</p>
              <p className="mt-2 text-muted-foreground">
                Tente ajustar os filtros ou buscar por outro termo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
