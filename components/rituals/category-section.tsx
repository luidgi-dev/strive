"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  title: string;
  /** Number of rituals in the category; surfaced as a reminder once collapsed. */
  count: number;
  children: React.ReactNode;
};

export function CategorySection({ title, count, children }: Props) {
  const t = useTranslations("rituals.category");
  const [open, setOpen] = useState(true);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      render={<section className="flex flex-col gap-2" />}
    >
      <h2 className="px-1 pb-0.5">
        <Collapsible.Trigger
          aria-label={t(open ? "collapse" : "expand", { category: title })}
          className="group flex items-center gap-1.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground outline-none"
        >
          {title}
          <ChevronDown
            aria-hidden
            className={cn(
              "size-3 transition-transform duration-200 ease-out",
              !open && "-rotate-90",
            )}
          />
          {!open ? (
            <span className="font-medium tracking-normal tabular-nums text-muted-foreground/70">
              {count}
            </span>
          ) : null}
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Panel
        className={cn(
          "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out",
          "data-[starting-style]:h-0 data-[ending-style]:h-0",
        )}
      >
        <div className="flex flex-col gap-2">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
