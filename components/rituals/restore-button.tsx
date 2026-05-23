"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { restoreRitual } from "@/app/[locale]/protected/(app)/rituals/actions";
import { cn } from "@/lib/utils";

type Props = { ritualId: string };

export function RestoreButton({ ritualId }: Props) {
  const t = useTranslations("rituals.archived");
  const [errored, setErrored] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onRestore = () => {
    setErrored(false);
    startTransition(async () => {
      const result = await restoreRitual(ritualId);
      // On success the row disappears via revalidation; nothing else to do.
      if (!result.ok) setErrored(true);
    });
  };

  const label = isPending
    ? t("restoring")
    : errored
      ? t("retry")
      : t("restore");

  return (
    <button
      type="button"
      onClick={onRestore}
      disabled={isPending}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border bg-transparent px-3.5 text-xs font-semibold transition-colors min-h-[44px]",
        errored
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border text-foreground hover:bg-foreground/5",
        isPending && "opacity-60",
      )}
    >
      <RotateCcw aria-hidden className="size-3.5" />
      {label}
    </button>
  );
}
