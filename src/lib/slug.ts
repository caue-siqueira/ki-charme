// Geração de slugs de URL a partir de nomes digitados pela dona da loja.

export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "peca";
}

// Garante slug único: "vestido-azul", depois "vestido-azul-2", "-3"...
export function uniqueSlug(input: string, taken: Iterable<string>): string {
  const root = slugify(input);
  const used = new Set(taken);
  if (!used.has(root)) return root;
  let n = 2;
  while (used.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}
