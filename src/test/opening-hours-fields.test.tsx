import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { OpeningHoursFields } from "@/components/admin/OpeningHoursFields";
import { defaultOpeningHours } from "@/lib/opening-hours";

function Form() {
  const [days, setDays] = useState(defaultOpeningHours);
  return <OpeningHoursFields days={days} onChange={setDays} />;
}

describe("Edição dos horários da semana", () => {
  it("altera o sábado sem mudar a sexta e permite marcar um dia como fechado", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<Form />));
      const saturday = container.querySelector<HTMLInputElement>(
        '[aria-label="Fechamento de Sábado"]',
      )!;
      expect(saturday).toHaveValue("13:00");
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        setter.call(saturday, "14:00");
        saturday.dispatchEvent(new Event("input", { bubbles: true }));
        saturday.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(saturday).toHaveValue("14:00");
      expect(container.querySelector('[aria-label="Fechamento de Sexta-feira"]')).toHaveValue(
        "18:00",
      );
      const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      await act(async () => checkboxes[5]!.click());
      expect(saturday).toBeDisabled();
      expect(container.querySelector('[aria-label="Abertura de Sábado"]')).toBeDisabled();
      await act(async () => checkboxes[5]!.click());
      expect(saturday).toBeEnabled();
      expect(saturday).toHaveValue("14:00");
      expect(checkboxes[6]).not.toBeChecked();
    } finally {
      await act(async () => root.unmount());
      container.remove();
    }
  });
});
