"use client";

import { Check, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { undoRitualLog } from "@/app/[locale]/protected/(app)/chat-actions";
import { cn } from "@/lib/utils";

import { MomentumMeter } from "./momentum-meter";
import type { LogCardData } from "./schemas";

/**
 * Confirmation card after a log (from the `log_ritual` tool or a disambiguation
 * chip). Shows what was logged with the updated momentum, plus an Undo that
 * removes the log via a server action (no chat round-trip, so no credit).
 */
export function LogCard({ data }: { data: LogCardData }) {
  const t = useTranslations("rituals.ai.cards");
  const [state, setState] = useState<"logged" | "undoing" | "undone">("logged");
  const { momentum } = data;

  const undo = async () => {
    setState("undoing");
    const result = await undoRitualLog(data.log_id);
    setState(result.ok ? "undone" : "logged");
  };

  const meter =
    state !== "undone" &&
    momentum.target != null &&
    momentum.logs_this_period != null
      ? { logs: momentum.logs_this_period, target: momentum.target }
      : null;

  return (
    <div className="flex w-[88%] max-w-[88%] items-center gap-3 self-start rounded-2xl border border-border bg-card p-3">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          state === "undone"
            ? "bg-muted-foreground/15 text-muted-foreground"
            : "bg-momentum/15 text-momentum",
        )}
      >
        <Check aria-hidden className="size-4" strokeWidth={2.5} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={cn(
            "truncate text-sm font-semibold",
            state === "undone"
              ? "text-muted-foreground line-through"
              : "text-foreground",
          )}
        >
          {t("logged")} · {data.ritual_name}
        </span>
        {meter ? (
          <MomentumMeter
            logs={meter.logs}
            target={meter.target}
            status={momentum.status}
          />
        ) : null}
      </div>

      {state === "undone" ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          {t("undone")}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => void undo()}
          disabled={state === "undoing"}
          className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          <Undo2 aria-hidden className="size-3.5" strokeWidth={2} />
          {state === "undoing" ? t("undoing") : t("undo")}
        </button>
      )}
    </div>
  );
}
