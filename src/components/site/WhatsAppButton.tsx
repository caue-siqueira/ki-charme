import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { getStoreSettings } from "@/data/catalog";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function openWhatsApp(message: string) {
  const url = waLink(getStoreSettings().whatsappNumber, message);
  if (!url) {
    toast.info("O WhatsApp da loja ainda não foi configurado.", {
      description: import.meta.env.DEV
        ? "Defina VITE_WHATSAPP_NUMBER (ex.: 5511999999999) para ativar."
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
  return (
    <button
      type="button"
      onClick={() => openWhatsApp(message())}
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
  if (!import.meta.env.DEV || getStoreSettings().whatsappNumber) return null;
  return (
    <div className="bg-secondary px-4 py-2 text-center text-sm">
      Ambiente de desenvolvimento: configure o número do WhatsApp em{" "}
      <code>VITE_WHATSAPP_NUMBER</code> para ativar os botões de compra.
    </div>
  );
}
