"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const CURATED_EMOJIS = [
  // Movement
  "🏃", "🧘", "🏋️", "🚴", "🌄",
  // Mind & Focus
  "📚", "✍️", "🧠", "🎯", "💻",
  // Body & Self-care
  "🥗", "💧", "🌙", "🪞", "❤️",
  // Life & Home
  "🏠", "☀️", "📅", "🎨", "✈️",
  // Others
  "🛒", "💰", " 👥", "🐕",
] as const;

type Props = {
  value: string | null;
  onChange: (next: string | null) => void;
};

export function EmojiGrid({ value, onChange }: Props) {
  const t = useTranslations("rituals.form.icon");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-accent/40 p-3">
      <div className="grid grid-cols-6 gap-1.5">
        {CURATED_EMOJIS.map((emoji) => {
          const active = emoji === value;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(active ? null : emoji)}
              aria-pressed={active}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg text-xl transition-colors min-h-[44px]",
                active
                  ? "bg-foreground/15 ring-1 ring-foreground/30"
                  : "bg-card hover:bg-foreground/5",
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="self-start text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {t("clear")}
        </button>
      ) : null}
    </div>
  );
}
