export const PHOTO_BUCKET = "product-photos";

// Aceita caminhos internos e URLs completas sem duplicar o bucket ou a codificação.
export function photoUrl(storagePath: string): string {
  const raw = storagePath.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)?.replace(/\/+$/, "");
  if (!base || !raw) return "";
  const path = raw.replace(/^\/+/, "").replace(new RegExp(`^${PHOTO_BUCKET}/`), "");
  const encoded = path
    .split("/")
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${encoded}`;
}
