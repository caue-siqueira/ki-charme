import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useStoreSettings, useStoreSettingsQuery } from "@/data/store-settings";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function openWhatsApp(message: string, whatsappNumber: string) {
  const url = waLink(whatsappNumber, message);
  if (!url) {
    toast.info("O WhatsApp da loja ainda não foi configurado.", {
      description: import.meta.env.DEV
        ? "Defina o número em Painel → Configurações para ativar."
        : "Por favor, tente novamente mais tarde.",
    });
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export function WhatsAppButton({
  message,
  label = "Comprar pelo WhatsApp",
  className,
  variant = "solid",
}: {
  message: () => string;
  label?: string;
  className?: string;
  variant?: "solid" | "outline" | "compact";
}) {
  const settings = useStoreSettings();
  return (
    <button
      type="button"
      onClick={() => openWhatsApp(message(), settings.whatsappNumber)}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 font-semibold transition-colors",
        variant === "solid" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "outline" && "border border-primary text-primary hover:bg-accent",
        variant === "compact" && "min-h-10 px-3 text-sm text-primary hover:bg-accent",
        className,
      )}
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

export function WhatsAppSetupNotice() {
  const { data: settings, isPending, isError } = useStoreSettingsQuery();
  if (!import.meta.env.DEV || isPending || settings?.whatsappNumber) return null;
  return (
    <div className="bg-secondary px-4 py-2 text-center text-sm">
      {isError
        ? "Não foi possível carregar as informações de contato da loja. Tente atualizar a página."
        : "Ambiente de desenvolvimento: configure o WhatsApp em Painel → Configurações para ativar os botões de compra."}
    </div>
  );
}
