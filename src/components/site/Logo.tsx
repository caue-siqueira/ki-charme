import { Link } from "@tanstack/react-router";
import { useStoreSettings } from "@/data/store-settings";

export function Logo({ compact }: { compact?: boolean }) {
  const s = useStoreSettings();
  return (
    <Link to="/" className="flex flex-col leading-none" aria-label={`${s.name} — página inicial`}>
      <span className="font-display text-3xl font-semibold italic tracking-wide text-primary md:text-4xl">
        {s.name}
      </span>
      {!compact && (
        <span className="mt-1 hidden sm:block text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
          {s.tagline}
        </span>
      )}
    </Link>
  );
}
