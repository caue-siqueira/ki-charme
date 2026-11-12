import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-client";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession } },
}));

const client = attachSupabaseAuth.options.client!;
function run(next = vi.fn().mockResolvedValue(undefined)) {
  return {
    next,
    result: client({
      data: undefined,
      context: undefined,
      sendContext: undefined,
      method: "GET",
      signal: new AbortController().signal,
      serverFnMeta: { id: "test" },
      filename: "test",
      next,
    }),
  };
}

beforeEach(() => vi.clearAllMocks());

describe("sessão Supabase nas funções de servidor", () => {
  it("envia o token da sessão no Authorization", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "user-token" } },
      error: null,
    });
    const { next, result } = run();
    await result;
    expect(next).toHaveBeenCalledWith({ headers: { Authorization: "Bearer user-token" } });
  });

  it("não inventa credenciais quando não existe sessão", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    const { next, result } = run();
    await result;
    expect(next).toHaveBeenCalledWith();
  });

  it("interrompe a chamada se não conseguir recuperar a sessão", async () => {
    const error = new Error("session error");
    getSession.mockResolvedValue({ data: { session: null }, error });
    const { next, result } = run();
    await expect(result).rejects.toThrow("session error");
    expect(next).not.toHaveBeenCalled();
  });
});
