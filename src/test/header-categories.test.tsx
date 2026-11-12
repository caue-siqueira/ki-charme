import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { storeSettingsQueryOptions } from "@/data/store-settings";
import { DEFAULT_SETTINGS } from "@/data/mappers";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CartProvider } from "@/lib/cart";

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function renderHeader() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(storeSettingsQueryOptions.queryKey, DEFAULT_SETTINGS);
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <SiteHeader />
          <Outlet />
        </CartProvider>
      </QueryClientProvider>
    ),
  });
  const paths = ["/", "/catalogo", "/sacola", "/sobre", "/categoria/$slug"] as const;
  const children = paths.map((path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => <div>Conteúdo da página</div>,
    }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren(children),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  await act(async () => root.render(<RouterProvider router={router} />));
  const trigger = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === "Categorias",
  );
  if (!trigger) throw new Error("Botão Categorias não encontrado.");
  return { trigger, router };
}

async function click(element: HTMLElement) {
  await act(async () => element.click());
}

function menu() {
  return document.querySelector('[role="dialog"][aria-label="Categorias da loja"]');
}

describe("Categorias no cabeçalho", () => {
  it("abre no primeiro clique após passar o mouse e fecha no segundo clique", async () => {
    const { trigger } = await renderHeader();
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    await click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(menu()).toBeVisible();
    expect(menu()).toHaveTextContent("Vestidos");
    await click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(menu()).toBeNull();
  });

  it("fecha com Escape", async () => {
    const { trigger } = await renderHeader();
    await click(trigger);
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(menu()).toBeNull();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("fecha e navega ao escolher uma categoria", async () => {
    const { trigger, router } = await renderHeader();
    await click(trigger);
    const link = menu()?.querySelector<HTMLAnchorElement>('a[href^="/categoria/"]');
    if (!link) throw new Error("Link de categoria não encontrado.");
    const target = new URL(link.href).pathname;
    await click(link);
    expect(menu()).toBeNull();
    expect(router.state.location.pathname).toBe(target);
  });
});
