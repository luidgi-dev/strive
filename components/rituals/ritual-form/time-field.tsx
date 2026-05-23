"use client";

import { Clock } from "lucide-react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  id?: string;
};

export function TimeField({ value, onChange, ariaLabel, id }: Props) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-lg border border-transparent bg-accent px-3.5 text-sm font-medium text-foreground focus-within:border-foreground/35 focus-within:bg-card">
      <Clock aria-hidden className="size-4 text-muted-foreground" />
      <input
        id={id}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="flex-1 bg-transparent text-foreground outline-none"
      />
    </label>
  );
}
