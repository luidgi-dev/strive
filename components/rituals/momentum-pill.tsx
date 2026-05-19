import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { MomentumStatus } from "@/lib/data/rituals";

type Props = {
  status: MomentumStatus;
};

const dotClassByStatus: Record<MomentumStatus, string> = {
  strong: "bg-momentum",
  steady: "bg-caution",
  resting: "bg-muted-foreground",
};

const textClassByStatus: Record<MomentumStatus, string> = {
  strong: "text-momentum",
  steady: "text-caution",
  resting: "text-muted-foreground",
};

export async function MomentumPill({ status }: Props) {
  const t = await getTranslations("rituals.status");

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", dotClassByStatus[status])}
      />
      <span
        className={cn(
          "text-[11px] font-semibold tracking-wide",
          textClassByStatus[status],
        )}
      >
        {t(status)}
      </span>
    </span>
  );
}
