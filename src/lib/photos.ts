// Envio e remoção de fotos da loja. Roda no navegador, com a sessão da dona;
// as regras do banco só deixam administrador mexer nessas pastas.
import { supabase } from "@/integrations/supabase/client";
import { PHOTO_BUCKET } from "@/lib/media";

const ALLOWED = ["jpg", "jpeg", "png", "webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export function checkPhotoFile(file: File): string | null {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED.includes(ext)) return "Use uma foto em JPG, PNG ou WebP.";
  if (file.size > MAX_BYTES) return "A foto precisa ter no máximo 10 MB.";
  return null;
}

// Devolve o caminho interno da foto, ex.: products/9f3c...jpg
export async function uploadProductPhoto(file: File): Promise<string> {
  const problem = checkPhotoFile(file);
  if (problem) throw new Error(problem);
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `products/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw new Error(`Não deu para enviar a foto: ${error.message}`);
  return path;
}

export async function deleteProductPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  if (error) throw new Error(`Não deu para apagar a foto: ${error.message}`);
}
