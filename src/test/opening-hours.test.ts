import { describe, expect, it } from "vitest";
import {
  defaultOpeningHours,
  formatOpeningHours,
  parseOpeningHours,
  validateOpeningHours,
} from "@/lib/opening-hours";

describe("Horários por dia da semana", () => {
  it("salva e recupera segunda a sexta até 18h, sábado até 13h e domingo fechado", () => {
    const days = defaultOpeningHours();
    const text = formatOpeningHours(days);
    expect(text).toContain("Segunda-feira: 09:00 às 18:00");
    expect(text).toContain("Sábado: 09:00 às 13:00");
    expect(text).toContain("Domingo: Fechado");
    expect(parseOpeningHours(text)).toEqual(days);
  });
  it("identifica texto antigo para que o painel o preserve até uma alteração", () => {
    expect(parseOpeningHours("Seg a sáb, 10h às 19h")).toBeNull();
    expect(parseOpeningHours("")).toBeNull();
  });
  it("recusa horários incompletos ou fechamento anterior à abertura", () => {
    const days = defaultOpeningHours();
    days[5]!.to = "08:00";
    expect(validateOpeningHours(days)).toContain("Sábado");
    days[5]!.to = "";
    expect(validateOpeningHours(days)).toContain("Sábado");
    days[5]!.open = false;
    expect(validateOpeningHours(days)).toBeNull();
  });
});
