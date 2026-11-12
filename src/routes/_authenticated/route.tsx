// Área protegida: só entra quem tem sessão válida. A confirmação de que a
// pessoa é administradora acontece em cada função do banco, não só aqui.
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: () => <Outlet />,
});
