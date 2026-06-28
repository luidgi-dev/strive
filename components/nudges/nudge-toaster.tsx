"use client";

import { HeartHandshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { markNudgesSeen } from "@/app/[locale]/protected/actions";
import { Toast } from "@/components/ui/toast";
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
  // Capture the nudges present on open. The toast acts on them once; it must not
  // react to later layout re-renders (which would clear the dismiss timer).
  const nudgesRef = useRef(nudges);

  useEffect(() => {
    void markNudgesSeen(nudgesRef.current.map((n) => n.id));
    const timer = setTimeout(() => setVisible(false), DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (nudges.length === 0 || !visible) return null;

  const [first] = nudges;
  const extra = nudges.length - 1;

  return (
    <Toast
      icon={<HeartHandshake className="size-[18px]" />}
      onDismiss={() => setVisible(false)}
      dismissLabel={t("toast.dismiss")}
    >
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
    </Toast>
  );
}
