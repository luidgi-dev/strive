import { MOMENTUM_TOKENS } from "@/lib/rituals/presentation";
import { cn } from "@/lib/utils";

import type { MomentumStatus } from "./schemas";

/**
 * The compact X/target bar shared by the momentum and log cards. Reuses the
 * app's `MOMENTUM_TOKENS` so the chat bar color matches the Rhythm cards.
 */
export function MomentumMeter({
  logs,
  target,
  status,
}: {
  logs: number;
  target: number;
  status: MomentumStatus | null;
}) {
  const percent = target > 0 ? Math.min(100, Math.round((logs / target) * 100)) : 0;
  const bar = status ? MOMENTUM_TOKENS[status].bar : "bg-muted-foreground/40";

  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-foreground/10">
        <span
          className={cn("block h-full rounded-full", bar)}
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
        {logs}/{target}
      </span>
    </span>
  );
}
