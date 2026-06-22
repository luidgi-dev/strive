"use client";

import { HeartHandshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { sendNudge } from "@/app/[locale]/protected/(app)/circles/[id]/actions";
import { cn } from "@/lib/utils";

type Props = {
  circleId: string;
  receiverId: string;
  receiverName: string | null;
  /** Whether the current user already nudged this member today. */
  nudged: boolean;
};

/**
 * The nudge action on a member row. Optimistic: on tap it fills into the "sent"
 * state and pops immediately, then calls the server action. A hard failure
 * reverts; "already nudged today" keeps the sent state (it is, in effect, sent).
 * Disabled once sent — one nudge per member per day, enforced server-side.
 */
export function CircleNudgeButton({
  circleId,
  receiverId,
  receiverName,
  nudged: initialNudged,
}: Props) {
  const t = useTranslations("circles.detail");
  const [nudged, setNudged] = useState(initialNudged);
  // Animate only on a fresh tap, not for members already nudged on page load.
  const [popped, setPopped] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (nudged || isPending) return;
    setNudged(true);
    setPopped(true);
    startTransition(async () => {
      const result = await sendNudge(circleId, receiverId);
      if (!result.ok && result.error !== "alreadyNudged") {
        setNudged(false);
        setPopped(false);
      }
    });
  };

  const name = receiverName ?? "";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={nudged}
      aria-label={nudged ? t("nudged", { name }) : t("nudge", { name })}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
        nudged
          ? "cursor-default border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/35 hover:bg-accent hover:text-foreground",
        popped && "animate-nudge-pop",
      )}
    >
      <HeartHandshake aria-hidden className="size-4" />
    </button>
  );
}
