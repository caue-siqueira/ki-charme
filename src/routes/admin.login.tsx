import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Entrar na área da loja — Ki Charme" },
      {
        name: "description",
        content:
          "Acesso restrito para a dona da loja Ki Charme gerenciar peças, fotos e configurações.",
      },
      { property: "og:title", content: "Entrar na área da loja — Ki Charme" },
      { property: "og:description", content: "Acesso restrito para a dona da loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Quem já está dentro vai direto para o painel.
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive && data.session) navigate({ to: "/admin" });
    });
    return () => {
      alive = false;
    };
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError("E-mail ou senha incorretos. Confira e tente de novo.");
      setBusy(false);
      return;
    }
    navigate({ to: "/admin" });
  };

  const field = "min-h-12 w-full rounded-md border border-input bg-card px-4 text-base";

  return (
    <div className="container-site flex min-h-[70vh] items-center justify-center py-12">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-card p-6 shadow-soft sm:p-8">
        <p className="eyebrow">Área da loja</p>
        <h1 className="mt-2 text-3xl">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Só a dona da loja consegue entrar. Se você chegou por engano,{" "}
          <Link to="/" className="font-semibold text-primary underline">
            volte para o catálogo
          </Link>
          .
        </p>

        <label className="mt-6 block">
          <span className="mb-1 block font-semibold">E-mail</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
            placeholder="voce@email.com"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block font-semibold">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
            placeholder="Sua senha"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 min-h-12 w-full rounded-md bg-primary font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
