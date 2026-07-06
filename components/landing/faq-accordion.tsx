"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * Landing FAQ accordion. Mirrors the RhythmDoneSection collapsible recipe
 * (chevron rotation + height transition), one disclosure per question, all
 * collapsed by default. Height/opacity easing is the only motion, and the
 * global `prefers-reduced-motion` rule already neutralizes it.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="flex flex-col border-t border-border">
      {items.map((item) => (
        <FaqRow key={item.question} item={item} />
      ))}
    </div>
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      render={<div className="border-b border-border" />}
    >
      <Collapsible.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left outline-none">
        <span className="font-sans text-base font-medium text-foreground">
          {item.question}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
            !open && "-rotate-90",
          )}
        />
      </Collapsible.Trigger>
      <Collapsible.Panel
        className={cn(
          "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out",
          "data-[starting-style]:h-0 data-[ending-style]:h-0",
        )}
      >
        <p className="pb-5 font-sans text-sm leading-relaxed text-muted-foreground">
          {item.answer}
        </p>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
