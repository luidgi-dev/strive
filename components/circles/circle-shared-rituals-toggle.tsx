"use client";

import { ChevronDown, ListChecks } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  shareRitualInCircle,
  unshareRitualInCircle,
} from "@/app/[locale]/protected/(app)/circles/[id]/actions";
import { Switch } from "@/components/ui/switch";
import type { CircleRitualToggle } from "@/lib/data/circles";
import { cn } from "@/lib/utils";

type Props = {
  circleId: string;
  rituals: CircleRitualToggle[];
};

/**
 * The current user's private control panel: which of their rituals are visible in
 * this circle. Toggling opts a ritual in/out (server action), updated optimistically
 * and reverted on failure. Collapsible so the weekly feed stays the focus.
 */
export function CircleSharedRitualsToggle({ circleId, rituals }: Props) {
  const t = useTranslations("circles.detail");
  const [expanded, setExpanded] = useState(true);
  const [shared, setShared] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rituals.map((r) => [r.ritualId, r.shared])),
  );
  const [, startTransition] = useTransition();

  const onToggle = (ritualId: string, next: boolean) => {
    setShared((prev) => ({ ...prev, [ritualId]: next }));
    startTransition(async () => {
      const result = next
        ? await shareRitualInCircle(circleId, ritualId)
        : await unshareRitualInCircle(circleId, ritualId);
      // The server is the source of truth: revert the optimistic flip on failure.
      if (!result.ok) {
        setShared((prev) => ({ ...prev, [ritualId]: !next }));
      }
    });
  };

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {t("mySharedRituals")}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={t("mySharedRituals")}
            className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3.5 transition-transform",
                !expanded && "-rotate-90",
              )}
            />
          </button>
        </div>
        <p className="text-[11.5px] leading-snug text-muted-foreground/80">
          {t("sharedPrivacy")}
        </p>
      </div>

      {expanded ? (
        rituals.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
            {t("noRituals")}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-border bg-card">
            {rituals.map((ritual) => (
              <li
                key={ritual.ritualId}
                className="flex items-center gap-3 border-b border-border px-3.5 py-3 last:border-b-0"
              >
                <span
                  aria-hidden
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-[15px] text-muted-foreground"
                >
                  {ritual.icon ?? <ListChecks className="size-4" />}
                </span>
                <span className="min-w-0 flex-1 truncate font-heading text-[14px] font-semibold tracking-[-0.005em] text-foreground">
                  {ritual.name}
                </span>
                <Switch
                  checked={shared[ritual.ritualId] ?? false}
                  onCheckedChange={(checked) =>
                    onToggle(ritual.ritualId, checked)
                  }
                  aria-label={ritual.name}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
