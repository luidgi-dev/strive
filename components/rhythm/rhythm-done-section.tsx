"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  /** Number of rituals already done today; shown next to the label. */
  count: number;
  children: ReactNode;
};

/**
 * Collapsible "Done today" group at the bottom of Rhythm. Mirrors the rituals
 * CategorySection pattern, but defaults collapsed: satisfied rituals stay
 * reachable (undo / log again) without cluttering the active list.
 */
export function RhythmDoneSection({ count, children }: Props) {
  const t = useTranslations("rhythm");
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      render={<section className="mt-2 flex flex-col gap-3" />}
    >
      <div className="flex min-h-8 items-center pl-1">
        <h2 className="min-w-0">
          <Collapsible.Trigger className="group flex items-center gap-1.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground outline-none">
            {t("doneToday")}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3 transition-transform duration-200 ease-out",
                !open && "-rotate-90",
              )}
            />
            <span className="font-medium tracking-normal tabular-nums text-muted-foreground/70">
              {count}
            </span>
          </Collapsible.Trigger>
        </h2>
      </div>
      <Collapsible.Panel
        className={cn(
          "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out",
          "data-[starting-style]:h-0 data-[ending-style]:h-0",
        )}
      >
        <div className="flex flex-col gap-3">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
