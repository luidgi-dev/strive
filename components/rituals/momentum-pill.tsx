import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import type { MomentumStatus } from "@/lib/data/rituals";
import { MOMENTUM_TOKENS } from "@/lib/rituals/presentation";

type Props = {
  status: MomentumStatus;
};

export async function MomentumPill({ status }: Props) {
  const t = await getTranslations("rituals.status");
  const tokens = MOMENTUM_TOKENS[status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn("size-1.5 rounded-full", tokens.dot)} />
      <span
        className={cn("text-[11px] font-semibold tracking-wide", tokens.text)}
      >
        {t(status)}
      </span>
    </span>
  );
}
