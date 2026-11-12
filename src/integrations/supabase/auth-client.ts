import { createMiddleware } from "@tanstack/react-start";

// Envia a sessão do navegador; o servidor valida o JWT e as permissões no banco.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { supabase } = await import("./client");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) return next();
    return next({
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
  },
);
