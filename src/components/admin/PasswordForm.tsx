import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const field = "min-h-12 w-full rounded-md border border-input bg-card px-4 text-base";
const labelCls = "mb-1 block font-semibold";

/** Troca de senha de quem está logado na área da loja. */
export function PasswordForm() {
  const [nova, setNova] = useState("");
  const [repetir, setRepetir] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (nova.length < 8) {
      toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (nova !== repetir) {
      toast.error("As duas senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: nova });
    setBusy(false);
    if (error) {
      toast.error(
        /security|recent|session|reauthenticate/i.test(error.message)
          ? "Por segurança, saia e entre de novo antes de trocar a senha."
          : "Não foi possível trocar a senha. Tente outra vez.",
      );
      return;
    }
    setNova("");
    setRepetir("");
    toast.success("Senha trocada. Use a nova senha da próxima vez.");
  };

  return (
    <form onSubmit={save} className="mt-6 max-w-2xl space-y-4 rounded-lg bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-display text-2xl">Sua senha</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Troque a senha temporária por uma que só você sabe.
        </p>
      </div>
      <label className="block">
        <span className={labelCls}>Nova senha</span>
        <input
          type="password"
          autoComplete="new-password"
          className={field}
          value={nova}
          onChange={(e) => setNova(e.target.value)}
        />
      </label>
      <label className="block">
        <span className={labelCls}>Repetir nova senha</span>
        <input
          type="password"
          autoComplete="new-password"
          className={field}
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Trocando…" : "Trocar senha"}
      </button>
    </form>
  );
}
