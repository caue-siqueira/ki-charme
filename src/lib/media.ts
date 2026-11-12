// Monta a URL pública de uma foto guardada no Storage.
// Bucket privado hoje: vira público quando a loja liberar a política do workspace.
const SUPABASE_URL = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? "";

export const PHOTO_BUCKET = "product-photos";

export function photoUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${storagePath}`;
}
