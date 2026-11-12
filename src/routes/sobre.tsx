import { createFileRoute } from "@tanstack/react-router";
import { getStoreSettings } from "@/data/catalog";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a Ki Charme" },
      { name: "description", content: "Conheça a Ki Charme, loja de moda feminina e acessórios." },
      { property: "og:title", content: "Sobre a Ki Charme" },
      { property: "og:description", content: "Conheça a Ki Charme e visite nossa loja." },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  const s = getStoreSettings();
  const pending = "A ser informado pela loja";
  return (
    <div className="container-site max-w-3xl py-14">
      <p className="eyebrow">{s.tagline}</p>
      <h1 className="mt-3 text-5xl">Sobre a {s.name}</h1>
      <p className="mt-6 text-lg">{s.about}</p>
      <dl className="mt-10 grid gap-6 rounded-lg bg-card p-6 sm:grid-cols-2">
        {(
          [
            ["Endereço", s.address],
            ["Horário de funcionamento", s.hours],
            ["Trocas", s.exchangePolicy],
            ["Retirada", s.pickupInfo],
          ] as const
        ).map(([k, v]) => (
          <div key={k}>
            <dt className="font-semibold">{k}</dt>
            <dd className="text-muted-foreground">{v ?? pending}</dd>
          </div>
        ))}
      </dl>
      <WhatsAppButton
        className="mt-8"
        label="Falar com a loja"
        message={() => `Olá! Vim pelo site da ${s.name} e gostaria de mais informações.`}
      />
    </div>
  );
}
