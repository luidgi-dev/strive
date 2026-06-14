import { type DynamicToolUIPart, getToolName, type ToolUIPart } from "ai";

import { DisambiguationCard } from "./disambiguation-card";
import { LogCard } from "./log-card";
import { MomentumCard } from "./momentum-card";
import { RitualListCard } from "./ritual-list-card";
import {
  ambiguousSchema,
  listRitualsSchema,
  logResultSchema,
  momentumSummarySchema,
} from "./schemas";

/**
 * Renders a finished tool call as its card. Tool outputs are typed `unknown`,
 * so each branch `safeParse`s the expected shape and falls back to nothing
 * (letting the model's accompanying text stand) when it doesn't match. Tools
 * without a card (create_ritual, get_log_history) render nothing here.
 */
export function ToolCard({ part }: { part: ToolUIPart | DynamicToolUIPart }) {
  if (part.state !== "output-available") return null;
  const name = getToolName(part);
  const output = part.output;

  if (name === "get_momentum_summary") {
    const parsed = momentumSummarySchema.safeParse(output);
    return parsed.success ? <MomentumCard rituals={parsed.data.rituals} /> : null;
  }

  if (name === "list_rituals") {
    const parsed = listRitualsSchema.safeParse(output);
    return parsed.success ? (
      <RitualListCard
        rituals={parsed.data.rituals}
        category={parsed.data.category ?? null}
      />
    ) : null;
  }

  if (name === "log_ritual") {
    const log = logResultSchema.safeParse(output);
    if (log.success) return <LogCard data={log.data} />;
    const ambiguous = ambiguousSchema.safeParse(output);
    return ambiguous.success ? (
      <DisambiguationCard candidates={ambiguous.data.candidates} />
    ) : null;
  }

  return null;
}
