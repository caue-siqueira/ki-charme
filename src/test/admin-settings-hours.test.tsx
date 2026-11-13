import { act, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/_authenticated/admin/configuracoes";
import { SiteFooter } from "@/components/site/SiteFooter";
import { defaultOpeningHours, formatOpeningHours } from "@/lib/opening-hours";
import type { SettingsRow } from "@/data/mappers";

const server = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));
vi.mock("@/data/admin.functions", () => ({
  adminGetSettings: server.get,
  adminUpdateSettings: server.update,
}));
vi.mock("@/components/admin/AdminShell", () => ({
  AdminShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AdminLoading: () => <p>Carregando</p>,
  AdminError: ({ text }: { text: string }) => <p>{text}</p>,
}));
vi.mock("@/components/admin/PasswordForm", () => ({ PasswordForm: () => null }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const AdminSettings = Route.options.component as ComponentType;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("Salvar horários no painel e atualizar o rodapé", () => {
  it("substitui o texto antigo pelos dias visíveis ao salvar, mesmo sem editar os campos", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.stubEnv("VITE_SUPABASE_URL", "https://store.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    let row = {
      id: "00000000-0000-0000-0000-000000000001",
      store_name: "Ki Charme",
      subtitle: "Moda",
      whatsapp_number: "5511999999999",
      instagram_url: null,
      address: null,
      opening_hours: "Seg a Sex 09:00–18:30",
      pickup_information: null,
      exchange_policy: null,
      about: null,
      logo_url: null,
      created_at: "2026-11-12T00:00:00Z",
      updated_at: "2026-11-12T00:00:00Z",
    } as SettingsRow;
    server.get.mockImplementation(async () => ({ ...row }));
    server.update.mockImplementation(async ({ data }: { data: { openingHours: string } }) => {
      row = { ...row, opening_hours: data.openingHours };
      return { ok: true };
    });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([row]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => {
        root.render(
          <QueryClientProvider client={client}>
            <AdminSettings />
            <SiteFooter />
          </QueryClientProvider>,
        );
      });
      await act(async () => {
        await client.refetchQueries();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      const footer = container.querySelector("footer")!;
      expect(footer).toHaveTextContent("Seg a Sex 09:00–18:30");
      expect(container.querySelector('[aria-label="Fechamento de Sábado"]')).toHaveValue("13:00");
      await act(async () => {
        container
          .querySelector("form")!
          .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await vi.waitFor(() => expect(server.update).toHaveBeenCalledTimes(1));
        await client.refetchQueries();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      expect(server.update.mock.calls[0]![0].data.openingHours).toBe(
        formatOpeningHours(defaultOpeningHours()),
      );
      expect(footer).toHaveTextContent("Seg a Sex: 09:00 às 18:00");
      expect(footer).toHaveTextContent("Sáb: 09:00 às 13:00");
      expect(footer).toHaveTextContent("Dom: Fechado");
      expect(footer).not.toHaveTextContent("18:30");
    } finally {
      await act(async () => root.unmount());
      await client.cancelQueries();
      client.clear();
      container.remove();
    }
  });
});
