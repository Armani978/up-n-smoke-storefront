import { NICOTINE_WARNING } from "@/lib/promo";

export function NicotineWarning({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "nicotine-warning is-compact" : "nicotine-warning"} role="note" aria-label="Nicotine warning">
      <strong>{NICOTINE_WARNING}</strong>
    </div>
  );
}
