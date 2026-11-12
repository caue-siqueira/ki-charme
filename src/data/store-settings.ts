import { queryOptions, useQuery } from "@tanstack/react-query";
import { buildSettings, DEFAULT_SETTINGS, type SettingsRow } from "./mappers";

// A vitrine usa apenas a chave pública e respeita as políticas de leitura do banco.
export const storeSettingsQueryOptions = queryOptions({
  queryKey: ["catalog", "settings"],
  queryFn: async ({ signal }) => {
    const url = import.meta.env["VITE_SUPABASE_URL"];
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("As configurações do Supabase não foram informadas.");

    const endpoint = new URL("/rest/v1/store_settings", url);
    endpoint.searchParams.set("select", "*");
    endpoint.searchParams.set("id", "eq.00000000-0000-0000-0000-000000000001");
    const response = await fetch(endpoint, { headers: { apikey: key }, signal });
    if (!response.ok) throw new Error("Não foi possível carregar as informações da loja.");
    const rows: SettingsRow[] = await response.json();
    if (!Array.isArray(rows)) throw new Error("As informações da loja são inválidas.");
    return buildSettings(rows[0] ?? null);
  },
  staleTime: 30_000,
  refetchOnWindowFocus: "always",
  retry: 1,
});

export function useStoreSettingsQuery() {
  return useQuery(storeSettingsQueryOptions);
}

export function useStoreSettings() {
  return useStoreSettingsQuery().data ?? DEFAULT_SETTINGS;
}
