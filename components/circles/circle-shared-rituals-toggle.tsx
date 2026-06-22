"use client";

import { Collapsible } from "@base-ui/react/collapsible";
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
 * and reverted on failure. Collapsible (label-as-trigger, matching the app's other
 * sections) so the weekly feed stays the focus.
 */
export function CircleSharedRitualsToggle({ circleId, rituals }: Props) {
  const t = useTranslations("circles.detail");
  const [open, setOpen] = useState(true);
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
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      render={<section className="flex flex-col gap-2.5" />}
    >
      <div className="flex min-h-8 items-center pl-1">
        <h2 className="min-w-0">
          <Collapsible.Trigger className="group flex items-center gap-1.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground outline-none">
            {t("mySharedRituals")}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3 transition-transform duration-200 ease-out",
                !open && "-rotate-90",
              )}
            />
          </Collapsible.Trigger>
        </h2>
      </div>

      <Collapsible.Panel className="flex flex-col gap-2.5">
        <p className="px-1 text-[11.5px] leading-snug text-muted-foreground/80">
          {t("sharedPrivacy")}
        </p>
        {rituals.length === 0 ? (
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
        )}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
