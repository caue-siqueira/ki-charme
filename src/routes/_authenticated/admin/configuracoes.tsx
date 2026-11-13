import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminGetSettings, adminUpdateSettings } from "@/data/admin.functions";
import { AdminShell, AdminLoading, AdminError } from "@/components/admin/AdminShell";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { OpeningHoursFields } from "@/components/admin/OpeningHoursFields";
import {
  defaultOpeningHours,
  formatOpeningHours,
  parseOpeningHours,
  validateOpeningHours,
} from "@/lib/opening-hours";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da loja — Ki Charme" },
      { name: "description", content: "Dados de contato e informações da loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettings,
});

const field = "min-h-12 w-full rounded-md border border-input bg-card px-4 text-base";
const labelCls = "mb-1 block font-semibold";

const EMPTY = {
  storeName: "Ki Charme",
  subtitle: "Moda Feminina & Acessórios",
  whatsappNumber: "",
  instagramUrl: "",
  address: "",
  openingHours: "",
  pickupInformation: "",
  exchangePolicy: "",
  about: "",
};

function AdminSettings() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: () => adminGetSettings() });
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [hours, setHours] = useState(defaultOpeningHours);
  const [hoursChanged, setHoursChanged] = useState(false);
  const [legacyHours, setLegacyHours] = useState("");

  useEffect(() => {
    const s = settings.data;
    if (!s) return;
    const parsed = parseOpeningHours(s.opening_hours ?? "");
    setHours(parsed ?? defaultOpeningHours());
    setHoursChanged(false);
    setLegacyHours(!parsed ? (s.opening_hours ?? "") : "");
    setForm({
      storeName: s.store_name,
      subtitle: s.subtitle,
      whatsappNumber: s.whatsapp_number,
      instagramUrl: s.instagram_url ?? "",
      address: s.address ?? "",
      openingHours: s.opening_hours ?? "",
      pickupInformation: s.pickup_information ?? "",
      exchangePolicy: s.exchange_policy ?? "",
      about: s.about ?? "",
    });
  }, [settings.data]);

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const hoursError = validateOpeningHours(hours);
    if ((!legacyHours || hoursChanged) && hoursError) {
      toast.error(hoursError);
      return;
    }
    setBusy(true);
    try {
      await adminUpdateSettings({
        data: {
          ...form,
          openingHours: legacyHours && !hoursChanged ? legacyHours : formatOpeningHours(hours),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Configurações salvas.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  if (settings.isPending)
    return (
      <AdminShell title="Configurações">
        <AdminLoading />
      </AdminShell>
    );
  if (settings.error)
    return (
      <AdminShell title="Configurações">
        <AdminError text={String(settings.error.message)} />
      </AdminShell>
    );
  if (!settings.data)
    return (
      <AdminShell title="Configurações">
        <AdminError text="As configurações da loja não foram encontradas." />
      </AdminShell>
    );

  return (
    <AdminShell
      title="Configurações"
      intro="Estas informações aparecem no site e nas mensagens de WhatsApp."
    >
      <form onSubmit={save} className="max-w-2xl space-y-4 rounded-lg bg-card p-5 sm:p-6">
        <label className="block">
          <span className={labelCls}>Nome da loja</span>
          <input className={field} value={form.storeName} onChange={set("storeName")} />
        </label>
        <label className="block">
          <span className={labelCls}>Frase de apoio (embaixo do nome)</span>
          <input className={field} value={form.subtitle} onChange={set("subtitle")} />
        </label>
        <label className="block">
          <span className={labelCls}>WhatsApp</span>
          <input
            className={field}
            inputMode="tel"
            value={form.whatsappNumber}
            onChange={set("whatsappNumber")}
            placeholder="5511999999999"
          />
          <span className="mt-1 block text-sm text-muted-foreground">
            Com o código do país e o DDD. Ex.: 5511999999999. Sem ele, os botões de compra não
            funcionam.
          </span>
        </label>
        <label className="block">
          <span className={labelCls}>Instagram (opcional)</span>
          <input
            className={field}
            value={form.instagramUrl}
            onChange={set("instagramUrl")}
            placeholder="https://instagram.com/sualoja"
          />
        </label>
        <label className="block">
          <span className={labelCls}>Endereço (opcional)</span>
          <input className={field} value={form.address} onChange={set("address")} />
        </label>
        {legacyHours && !hoursChanged && (
          <div className="rounded-md bg-secondary p-3 text-sm">
            <p className="whitespace-pre-line">Horário salvo: {legacyHours}</p>
            <p className="mt-2">
              Confira os horários sugeridos abaixo. Para substituir o horário atual, use o botão ou
              altere algum dia e salve as configurações.
            </p>
            <button
              type="button"
              onClick={() => setHoursChanged(true)}
              className="mt-2 min-h-11 font-semibold text-primary underline"
            >
              Usar horários por dia
            </button>
          </div>
        )}
        <OpeningHoursFields
          days={hours}
          onChange={(next) => {
            setHours(next);
            setHoursChanged(true);
          }}
        />
        <label className="block">
          <span className={labelCls}>Como funciona a retirada (opcional)</span>
          <textarea
            className={`${field} min-h-24 py-3`}
            value={form.pickupInformation}
            onChange={set("pickupInformation")}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Política de trocas (opcional)</span>
          <textarea
            className={`${field} min-h-24 py-3`}
            value={form.exchangePolicy}
            onChange={set("exchangePolicy")}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Sobre a loja (opcional)</span>
          <textarea
            className={`${field} min-h-28 py-3`}
            value={form.about}
            onChange={set("about")}
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="min-h-12 w-full rounded-md bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
        >
          {busy ? "Salvando…" : "Salvar configurações"}
        </button>
      </form>

      <PasswordForm />
    </AdminShell>
  );
}
