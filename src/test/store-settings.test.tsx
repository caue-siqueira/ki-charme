import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { storeSettingsQueryOptions, useStoreSettings } from "@/data/store-settings";
import { DEFAULT_SETTINGS, type SettingsRow } from "@/data/mappers";

const row: SettingsRow = {
  id: "00000000-0000-0000-0000-000000000001",
  store_name: "Nome salvo no painel",
  subtitle: "Frase salva no painel",
  whatsapp_number: "+55 (11) 99999-0000",
  instagram_url: "https://instagram.com/loja",
  address: "Endereço salvo",
  opening_hours: "Segunda a sábado",
  pickup_information: "Retirada na loja",
  exchange_policy: "Troca em até 7 dias",
  about: "Sobre a loja",
  logo_url: null,
  created_at: "2026-11-12T00:00:00Z",
  updated_at: "2026-11-12T00:00:00Z",
};

let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
const fetchMock = vi.fn<typeof fetch>();

function response(rows: SettingsRow[]) {
  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubEnv("VITE_SUPABASE_URL", "https://store.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  fetchMock.mockReset().mockResolvedValue(response([row]));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(window, "open").mockReturnValue(null);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  await client.cancelQueries();
  client.clear();
  container.remove();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function Contact() {
  const settings = useStoreSettings();
  return (
    <p>
      {settings.name} — {settings.whatsappNumber}
    </p>
  );
}

async function renderContact() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Contact />
        <WhatsAppButton label="Contato" message={() => "Olá"} />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await client.ensureQueryData(storeSettingsQueryOptions);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const button = container.querySelector("button");
  if (!button) throw new Error("Contato não encontrado.");
  return button;
}

describe("Configurações públicas salvas no painel", () => {
  it("carrega do Supabase sem sessão e usa o WhatsApp salvo no botão", async () => {
    const button = await renderContact();
    expect(container).toHaveTextContent(row.store_name);
    expect(container).toHaveTextContent(row.whatsapp_number);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/rest/v1/store_settings");
    expect(new Headers(init?.headers).get("apikey")).toBe("sb_publishable_test");
    expect(new Headers(init?.headers).get("authorization")).toBeNull();
    await act(async () => button.click());
    expect(window.open).toHaveBeenCalledWith(
      "https://wa.me/5511999990000?text=Ol%C3%A1",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("troca o número no site após a invalidação feita pelo painel, sem recarregar", async () => {
    const button = await renderContact();
    fetchMock.mockResolvedValue(response([{ ...row, whatsapp_number: "5521988881111" }]));
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["catalog"] });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container).toHaveTextContent("5521988881111");
    await act(async () => button.click());
    expect(window.open).toHaveBeenCalledWith(
      "https://wa.me/5521988881111?text=Ol%C3%A1",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("mantém o WhatsApp vazio se não houver configurações, sem usar número demonstrativo", async () => {
    fetchMock.mockResolvedValue(response([]));
    const settings = await client.fetchQuery(storeSettingsQueryOptions);
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings.whatsappNumber).toBe("");
  });

  it("propaga a falha de leitura do banco em vez de retornar dados de demonstração", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    await expect(client.fetchQuery({ ...storeSettingsQueryOptions, retry: false })).rejects.toThrow(
      "Não foi possível carregar as informações da loja.",
    );
  });
});
