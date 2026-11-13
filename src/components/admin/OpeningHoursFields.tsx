import { WEEK_DAYS, type DayHours } from "@/lib/opening-hours";

export function OpeningHoursFields({
  days,
  onChange,
}: {
  days: DayHours[];
  onChange: (days: DayHours[]) => void;
}) {
  const update = (index: number, change: Partial<DayHours>) =>
    onChange(days.map((day, i) => (i === index ? { ...day, ...change } : day)));
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 font-semibold">Horário de funcionamento</legend>
      <p className="text-sm text-muted-foreground">
        Marque os dias em que a loja abre e informe os horários de cada dia.
      </p>
      {days.map((day, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-md border border-input p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center"
        >
          <label className="flex min-h-11 items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={day.open}
              onChange={(event) => update(index, { open: event.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            {WEEK_DAYS[index]}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="min-w-0 text-xs text-muted-foreground">
              Abertura
              <input
                type="time"
                aria-label={`Abertura de ${WEEK_DAYS[index]}`}
                required={day.open}
                disabled={!day.open}
                value={day.from}
                onChange={(event) => update(index, { from: event.target.value })}
                className="mt-1 min-h-12 w-full min-w-0 rounded-md border border-input bg-card px-2 text-base text-foreground disabled:opacity-40"
              />
            </label>
            <label className="min-w-0 text-xs text-muted-foreground">
              Fechamento
              <input
                type="time"
                aria-label={`Fechamento de ${WEEK_DAYS[index]}`}
                required={day.open}
                disabled={!day.open}
                value={day.to}
                onChange={(event) => update(index, { to: event.target.value })}
                className="mt-1 min-h-12 w-full min-w-0 rounded-md border border-input bg-card px-2 text-base text-foreground disabled:opacity-40"
              />
            </label>
          </div>
          {!day.open && (
            <span className="text-sm text-muted-foreground sm:col-span-2">Fechado</span>
          )}
        </div>
      ))}
    </fieldset>
  );
}
