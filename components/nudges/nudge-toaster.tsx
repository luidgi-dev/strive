"use client";

import { HeartHandshake, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { markNudgesSeen } from "@/app/[locale]/protected/actions";
import type { UnseenNudge } from "@/lib/data/nudges";

const DISMISS_AFTER_MS = 6000;

type Props = {
  nudges: UnseenNudge[];
};

/**
 * The in-app nudge toast, shown over any protected screen on app open when the
 * user has unseen nudges. It marks them seen on display (so each surfaces once)
 * and auto-dismisses. Multiple nudges collapse into one line with a "+N" tail.
 */
export function NudgeToaster({ nudges }: Props) {
  const t = useTranslations("nudges");
  const [visible, setVisible] = useState(true);
  const marked = useRef(false);

  useEffect(() => {
    if (marked.current || nudges.length === 0) return;
    marked.current = true;
    void markNudgesSeen(nudges.map((n) => n.id));
    const timer = setTimeout(() => setVisible(false), DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [nudges]);

  if (nudges.length === 0 || !visible) return null;

  const [first] = nudges;
  const extra = nudges.length - 1;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-50 flex justify-center px-4">
      <div
        role="status"
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-lg duration-300"
      >
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-foreground"
        >
          <HeartHandshake className="size-[18px]" />
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">
          {t("toast.single", {
            sender: first.senderName ?? t("someone"),
            circle: first.circleName ?? "",
          })}
          {extra > 0 ? (
            <span className="text-muted-foreground">
              {" "}
              {t("toast.more", { count: extra })}
            </span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label={t("toast.dismiss")}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}
