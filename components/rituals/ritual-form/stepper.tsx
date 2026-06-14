"use client";

import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  ariaLabel: string;
  decreaseLabel: string;
  increaseLabel: string;
};

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  ariaLabel,
  decreaseLabel,
  increaseLabel,
}: Props) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex h-11 items-center overflow-hidden rounded-full border border-border bg-accent"
    >
      <button
        type="button"
        aria-label={decreaseLabel}
        onClick={decrement}
        disabled={value <= min}
        className="flex h-full w-11 items-center justify-center text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40"
      >
        <Minus aria-hidden className="size-3.5" strokeWidth={2.25} />
      </button>
      <span
        className="min-w-7 px-1 text-center font-heading text-base font-bold tracking-tight tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={increaseLabel}
        onClick={increment}
        disabled={value >= max}
        className="flex h-full w-11 items-center justify-center text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-40"
      >
        <Plus aria-hidden className="size-3.5" strokeWidth={2.25} />
      </button>
    </div>
  );
}
