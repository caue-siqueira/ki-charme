import { Link } from "@tanstack/react-router";
import { useStoreSettings } from "@/data/store-settings";
import { openWhatsApp } from "./WhatsAppButton";

const pending = "A ser informado pela loja";

export function SiteFooter() {
  const s = useStoreSettings();
  const rows: [string, string | undefined][] = [
    ["Endereço", s.address],
    ["Horário", s.hours],
    ["Trocas", s.exchangePolicy],
    ["Retirada", s.pickupInfo],
  ];
  return (
    <footer className="mt-20 bg-secondary">
      <div className="container-site grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl italic text-primary">{s.name}</p>
          <p className="eyebrow mt-1">{s.tagline}</p>
          <div className="mt-6 flex flex-col items-start gap-2">
            <button
              onClick={() => openWhatsApp(`Olá! Vim pelo site da ${s.name}.`, s.whatsappNumber)}
              className="min-h-11 font-semibold text-primary hover:underline"
            >
              WhatsApp
            </button>
            {s.instagram ? (
              <a
                href={s.instagram}
                target="_blank"
                rel="noreferrer"
                className="min-h-11 font-semibold text-primary hover:underline"
              >
                Instagram
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">
                Instagram: {pending.toLowerCase()}
              </span>
            )}
          </div>
        </div>
        <dl className="space-y-3 text-sm md:col-span-2 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="font-semibold">{k}</dt>
              <dd className="whitespace-pre-line text-muted-foreground">{v ?? pending}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {s.name} ·{" "}
        <Link to="/sobre" className="underline">
          Sobre a loja
        </Link>
      </div>
    </footer>
  );
}
