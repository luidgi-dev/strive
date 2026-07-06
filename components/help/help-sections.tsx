"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type HelpBlock =
  | { kind: "p"; text: string }
  | { kind: "examples"; items: string[] }
  | { kind: "steps"; items: { label: string; text: string }[] }
  | { kind: "note"; text: string };

export type HelpSection = {
  id: string;
  title: string;
  blocks: HelpBlock[];
};

/**
 * Help content as an accordion. Panels use `keepMounted` so every section's
 * text ships in the server HTML even while collapsed — the page stays crawlable
 * (the whole point of a single indexable /help), and deep links from the table
 * of contents open the matching section.
 */
export function HelpSections({ sections }: { sections: HelpSection[] }) {
  return (
    <div className="border-t border-border">
      {sections.map((section, index) => (
        <HelpRow key={section.id} section={section} defaultOpen={index === 0} />
      ))}
    </div>
  );
}

function HelpRow({
  section,
  defaultOpen,
}: {
  section: HelpSection;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Open this section when the URL hash points at it (table-of-contents links).
  useEffect(() => {
    const syncFromHash = () => {
      if (window.location.hash.slice(1) === section.id) setOpen(true);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [section.id]);

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      render={
        <section id={section.id} className="scroll-mt-20 border-b border-border" />
      }
    >
      <h2 className="m-0">
        <Collapsible.Trigger className="group flex w-full items-center gap-4 py-5 text-left font-heading text-lg font-semibold tracking-tight text-foreground outline-none">
          <span className="flex-1">{section.title}</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
              !open && "-rotate-90",
            )}
          />
        </Collapsible.Trigger>
      </h2>
      <Collapsible.Panel
        keepMounted
        className={cn(
          "h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out",
          "data-[starting-style]:h-0 data-[ending-style]:h-0",
        )}
      >
        <div className="flex flex-col gap-4 pb-6 font-sans text-[15px] leading-relaxed text-muted-foreground">
          {section.blocks.map((block, i) => (
            <HelpBlockView key={i} block={block} />
          ))}
        </div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function HelpBlockView({ block }: { block: HelpBlock }) {
  switch (block.kind) {
    case "p":
      return <p>{block.text}</p>;
    case "examples":
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          {block.items.map((example) => (
            <span key={example} className="text-sm text-foreground">
              &ldquo;{example}&rdquo;
            </span>
          ))}
        </div>
      );
    case "steps":
      return (
        <ul className="flex list-none flex-col gap-2.5 p-0">
          {block.items.map((step) => (
            <li key={step.label} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 whitespace-nowrap rounded-full border border-border bg-accent px-2.5 py-0.5 text-xs font-semibold text-foreground">
                {step.label}
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ul>
      );
    case "note":
      return (
        <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
          {block.text}
        </p>
      );
  }
}
