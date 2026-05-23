"use client";

import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  onChange: (next: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  ariaLabel: string;
};

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex gap-0.5 rounded-full bg-accent p-[3px]"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded-full px-2.5 py-2 text-xs font-semibold tracking-wide transition-colors min-h-[44px]",
              active
                ? "bg-foreground/15 text-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
