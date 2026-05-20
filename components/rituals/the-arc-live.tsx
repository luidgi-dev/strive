"use client";

import { applyOptimisticToday, type ArcModel } from "@/lib/rituals/arc";

import { useRitualLog } from "./ritual-log-provider";
import { TheArc } from "./the-arc";

type Props = {
  baseModel: ArcModel;
  /** Today as YYYY-MM-DD, in the user's timezone. */
  today: string;
};

/**
 * Renders The Arc with today's optimistic log count overlaid, so the chart and
 * heatmap react the instant the user logs. Keeps TheArc a pure display component.
 */
export function TheArcLive({ baseModel, today }: Props) {
  const { count } = useRitualLog();
  return <TheArc model={applyOptimisticToday(baseModel, today, count)} />;
}
