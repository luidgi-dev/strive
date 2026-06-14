"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { logRitualFromChat } from "@/app/[locale]/protected/(app)/chat-actions";

import { LogCard } from "./log-card";
import type { Ambiguous, LogCardData } from "./schemas";

/**
 * Candidate chips shown when a log was ambiguous. Tapping a chip logs that
 * ritual directly via a server action (no chat message, no credit) and swaps in
 * the resulting log card.
 */
export function DisambiguationCard({
  candidates,
}: {
  candidates: Ambiguous["candidates"];
}) {
  const t = useTranslations("rituals.ai.cards");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [logged, setLogged] = useState<LogCardData | null>(null);

  if (logged) return <LogCard data={logged} />;

  const pick = async (id: string) => {
    setPendingId(id);
    const result = await logRitualFromChat(id);
    if (result.ok) setLogged(result.data);
    else setPendingId(null);
  };

  return (
    <div className="w-[88%] max-w-[88%] self-start rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 text-xs font-semibold text-muted-foreground">
        {t("pickRitual")}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {candidates.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => void pick(candidate.id)}
            disabled={pendingId !== null}
            className="rounded-full border border-foreground/25 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:opacity-50"
          >
            {candidate.name}
          </button>
        ))}
      </div>
    </div>
  );
}
