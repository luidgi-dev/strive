import type { ReactNode } from "react";

import { Link } from "@/lib/i18n/navigation";

type Props = {
  ritualId: string;
  children: ReactNode;
};

export function RitualCardTrigger({ ritualId, children }: Props) {
  return (
    <Link
      href={`/protected/rituals/${ritualId}`}
      className="group flex flex-1 min-w-0 items-center gap-3 rounded-l-xl py-3 pl-3.5 pr-2 text-left text-card-foreground transition-colors hover:bg-foreground/5 min-h-[44px]"
    >
      {children}
    </Link>
  );
}
