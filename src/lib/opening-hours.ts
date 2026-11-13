export const WEEK_DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
] as const;

export type DayHours = { open: boolean; from: string; to: string };

export function defaultOpeningHours(): DayHours[] {
  return WEEK_DAYS.map((_, index) => ({
    open: index < 6,
    from: "09:00",
    to: index === 5 ? "13:00" : "18:00",
  }));
}

export function validateOpeningHours(days: DayHours[]): string | null {
  for (const [index, day] of days.entries()) {
    if (!day.open) continue;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(day.from) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(day.to)) {
      return `Informe os horários de abertura e fechamento de ${WEEK_DAYS[index]}.`;
    }
    if (day.from >= day.to)
      return `O fechamento de ${WEEK_DAYS[index]} deve ser depois da abertura.`;
  }
  return null;
}

export function formatOpeningHours(days: DayHours[]): string {
  return days
    .map(
      (day, index) => `${WEEK_DAYS[index]}: ${day.open ? `${day.from} às ${day.to}` : "Fechado"}`,
    )
    .join("\n");
}

// O texto continua compatível com a coluna existente e com a vitrine.
export function parseOpeningHours(value: string): DayHours[] | null {
  const lines = value.trim().split("\n");
  if (lines.length !== WEEK_DAYS.length) return null;
  const days: DayHours[] = [];
  for (const [index, name] of WEEK_DAYS.entries()) {
    const line = lines[index]!;
    if (line === `${name}: Fechado`) {
      days.push({ open: false, from: "09:00", to: index === 5 ? "13:00" : "18:00" });
      continue;
    }
    const match = line.match(new RegExp(`^${name}: (\\d{2}:\\d{2}) às (\\d{2}:\\d{2})$`));
    if (!match) return null;
    days.push({ open: true, from: match[1]!, to: match[2]! });
  }
  return validateOpeningHours(days) ? null : days;
}

const SHORT_WEEK_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

/** Agrupa horários iguais para exibição, preservando a edição diária no painel. */
export function summarizeOpeningHours(value: string): string {
  const days = parseOpeningHours(value);
  if (!days) return value;

  const groups = new Map<string, { day: DayHours; indexes: number[] }>();
  days.forEach((day, index) => {
    const key = day.open ? `${day.from}-${day.to}` : "closed";
    const group = groups.get(key);
    if (group) group.indexes.push(index);
    else groups.set(key, { day, indexes: [index] });
  });

  return Array.from(groups.values(), ({ day, indexes }) => {
    const ranges: string[] = [];
    let start = indexes[0]!;
    let end = start;
    const appendRange = () =>
      ranges.push(
        start === end
          ? SHORT_WEEK_DAYS[start]!
          : `${SHORT_WEEK_DAYS[start]} a ${SHORT_WEEK_DAYS[end]}`,
      );
    for (const index of indexes.slice(1)) {
      if (index === end + 1) end = index;
      else {
        appendRange();
        start = end = index;
      }
    }
    appendRange();
    return `${ranges.join(", ")}: ${day.open ? `${day.from} às ${day.to}` : "Fechado"}`;
  }).join("\n");
}
