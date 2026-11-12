// Formulário de peça nova / edição. Um só formulário para as duas telas.
import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { adminSaveProduct, type AdminCategory, type AdminProduct } from "@/data/admin.functions";
import { checkPhotoFile, deleteProductPhoto, uploadProductPhoto } from "@/lib/photos";
import { photoUrl } from "@/lib/media";
import type { ProductColor, ProductStatus } from "@/types/catalog";

const field = "min-h-12 w-full rounded-md border border-input bg-card px-4 text-base";
const labelCls = "mb-1 block font-semibold";
const card = "rounded-lg bg-card p-5 sm:p-6";

const STATUSES: { value: ProductStatus; label: string; hint: string }[] = [
  { value: "published", label: "Publicada", hint: "aparece no site" },
  { value: "sold_out", label: "Esgotada", hint: "aparece marcada como esgotada" },
  { value: "hidden", label: "Oculta", hint: "só você enxerga" },
];

export function ProductForm({
  initial,
  categories,
  onSaved,
}: {
  initial?: AdminProduct;
  categories: AdminCategory[];
  onSaved?: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [promoPrice, setPromoPrice] = useState(
    initial?.promoPrice !== null && initial?.promoPrice !== undefined
      ? String(initial.promoPrice)
      : "",
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [sizeDraft, setSizeDraft] = useState("");
  const [colors, setColors] = useState<ProductColor[]>(initial?.colors ?? []);
  const [colorName, setColorName] = useState("");
  const [colorSwatch, setColorSwatch] = useState("#b82035");
  const [status, setStatus] = useState<ProductStatus>(initial?.status ?? "published");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [measurements, setMeasurements] = useState(initial?.measurements ?? "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos.map((p) => p.storagePath) ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const groups = categories.filter((c) => !c.parentId);

  const addSize = () => {
    const s = sizeDraft.trim().toUpperCase();
    if (!s) return;
    if (!sizes.includes(s)) setSizes([...sizes, s]);
    setSizeDraft("");
  };

  const addColor = () => {
    const n = colorName.trim();
    if (!n) return;
    if (!colors.some((c) => c.name.toLowerCase() === n.toLowerCase())) {
      setColors([...colors, { name: n, swatch: colorSwatch }]);
    }
    setColorName("");
  };

  const onPickPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    const sent: string[] = [];
    for (const file of files) {
      const problem = checkPhotoFile(file);
      if (problem) {
        toast.error(problem);
        continue;
      }
      try {
        sent.push(await uploadProductPhoto(file));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao enviar a foto.");
      }
    }
    if (sent.length) {
      setPhotos((prev) => [...prev, ...sent]);
      toast.success(`${sent.length} ${sent.length === 1 ? "foto enviada" : "fotos enviadas"}`);
    }
    setUploading(false);
  };

  const removePhoto = async (path: string) => {
    try {
      await deleteProductPhoto(path);
      setPhotos((prev) => prev.filter((p) => p !== path));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao apagar a foto.");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { id } = await adminSaveProduct({
        data: {
          id: initial?.id,
          name,
          description,
          price,
          promoPrice: promoPrice.trim() === "" ? null : promoPrice,
          categoryId,
          sizes,
          colors,
          status,
          featured,
          measurements: measurements || null,
          photos,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(initial ? "Peça atualizada." : "Peça criada.");
      onSaved?.(id);
      return id;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <label className="block">
          <span className={labelCls}>Nome da peça</span>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vestido floral midi"
          />
        </label>

        <label className="mt-4 block">
          <span className={labelCls}>Descrição</span>
          <textarea
            className={`${field} min-h-28 py-3`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Conte como a peça é, o tecido, o caimento…"
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Preço (R$)</span>
            <input
              className={field}
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="129,90"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Preço promocional (deixe vazio se não houver)</span>
            <input
              className={field}
              inputMode="decimal"
              value={promoPrice}
              onChange={(e) => setPromoPrice(e.target.value)}
              placeholder="99,90"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className={labelCls}>Categoria</span>
          <select
            className={field}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Escolha uma categoria</option>
            {groups.map((g) => (
              <optgroup key={g.id} label={g.name}>
                <option value={g.id}>{g.name} (todas)</option>
                {categories
                  .filter((s) => s.parentId === g.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className={labelCls}>Medidas (opcional)</span>
          <textarea
            className={`${field} min-h-24 py-3`}
            value={measurements}
            onChange={(e) => setMeasurements(e.target.value)}
            placeholder="Busto 92 cm · Cintura 74 cm · Comprimento 110 cm"
          />
        </label>
      </div>

      <div className={card}>
        <h2 className="text-xl">Tamanhos</h2>
        <div className="mt-3 flex gap-2">
          <input
            className={field}
            value={sizeDraft}
            onChange={(e) => setSizeDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSize();
              }
            }}
            placeholder="Digite um tamanho e aperte Enter"
          />
          <button
            type="button"
            onClick={addSize}
            className="min-h-12 shrink-0 rounded-md border border-primary px-4 font-semibold text-primary"
          >
            Adicionar
          </button>
        </div>
        {sizes.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setSizes(sizes.filter((x) => x !== s))}
                  className="min-h-11 rounded-full border border-input bg-background px-4 text-sm font-semibold hover:bg-accent"
                >
                  {s} <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-8 text-xl">Cores</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="min-w-40 flex-1">
            <span className="mb-1 block text-sm font-semibold">Nome da cor</span>
            <input
              className={field}
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              placeholder="Terracota"
            />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">Amostra</span>
            <input
              type="color"
              className="min-h-12 w-16 rounded-md border border-input bg-card"
              value={colorSwatch}
              onChange={(e) => setColorSwatch(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={addColor}
            className="min-h-12 shrink-0 rounded-md border border-primary px-4 font-semibold text-primary"
          >
            Adicionar
          </button>
        </div>
        {colors.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {colors.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  onClick={() => setColors(colors.filter((x) => x.name !== c.name))}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-input bg-background px-4 text-sm font-semibold hover:bg-accent"
                >
                  {c.swatch && (
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ background: c.swatch }}
                      aria-hidden
                    />
                  )}
                  {c.name} <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={card}>
        <h2 className="text-xl">Fotos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          JPG, PNG ou WebP de até 10 MB. A primeira foto é a que aparece no catálogo.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((path) => (
            <div key={path} className="relative overflow-hidden rounded-md bg-secondary">
              <img
                src={photoUrl(path)}
                alt="Foto da peça"
                className="aspect-[3/4] w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(path)}
                aria-label="Apagar foto"
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-sm font-bold text-destructive"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <label className="mt-4 inline-flex min-h-12 cursor-pointer items-center rounded-md border border-primary px-5 font-semibold text-primary">
          {uploading ? "Enviando…" : "Escolher fotos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={onPickPhotos}
            disabled={uploading}
          />
        </label>
      </div>

      <div className={card}>
        <h2 className="text-xl">Como a peça aparece</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={status === s.value}
              onClick={() => setStatus(s.value)}
              className={`min-h-12 rounded-md border px-4 text-left text-sm font-semibold ${status === s.value ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}
            >
              {s.label}
              <span className="block text-xs font-normal opacity-80">{s.hint}</span>
            </button>
          ))}
        </div>
        <label className="mt-5 flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          <span className="font-semibold">Mostrar em “Destaques” na página inicial</span>
        </label>
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="min-h-12 w-full rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Salvando…" : initial ? "Salvar alterações" : "Criar peça"}
        </button>
      </div>
    </div>
  );
}
