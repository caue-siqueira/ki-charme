import { describe, expect, it } from "vitest";
import {
  defaultOpeningHours,
  formatOpeningHours,
  parseOpeningHours,
  summarizeOpeningHours,
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

describe("Agrupamento dos horários exibidos no site", () => {
  it("junta segunda a sexta e separa sábado e domingo", () => {
    expect(summarizeOpeningHours(formatOpeningHours(defaultOpeningHours()))).toBe(
      "Seg a Sex: 09:00 às 18:00\nSáb: 09:00 às 13:00\nDom: Fechado",
    );
  });

  it("agrupa dias iguais sem incluir um dia intermediário com horário diferente", () => {
    const days = defaultOpeningHours();
    days[2]!.to = "17:00";
    expect(summarizeOpeningHours(formatOpeningHours(days))).toBe(
      "Seg a Ter, Qui a Sex: 09:00 às 18:00\nQua: 09:00 às 17:00\nSáb: 09:00 às 13:00\nDom: Fechado",
    );
  });

  it("separa dias com a mesma hora de fechamento e aberturas diferentes", () => {
    const days = defaultOpeningHours();
    days[4]!.from = "10:00";
    expect(summarizeOpeningHours(formatOpeningHours(days))).toContain(
      "Seg a Qui: 09:00 às 18:00\nSex: 10:00 às 18:00",
    );
  });

  it("junta os dias fechados independentemente dos horários desativados", () => {
    const days = defaultOpeningHours();
    days[5]!.open = false;
    expect(summarizeOpeningHours(formatOpeningHours(days))).toBe(
      "Seg a Sex: 09:00 às 18:00\nSáb a Dom: Fechado",
    );
  });

  it("junta a semana inteira quando os horários são iguais", () => {
    const days = defaultOpeningHours().map(() => ({ open: true, from: "09:00", to: "18:00" }));
    expect(summarizeOpeningHours(formatOpeningHours(days))).toBe("Seg a Dom: 09:00 às 18:00");
  });

  it("preserva textos antigos que não possuem horários estruturados", () => {
    expect(summarizeOpeningHours("Seg a Sex 09:00–18:30")).toBe("Seg a Sex 09:00–18:30");
  });
});
