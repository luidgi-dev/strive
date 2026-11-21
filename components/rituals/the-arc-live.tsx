"use client";

import { useRitualLog } from "./ritual-log-provider";
import { TheArcBrowser, type ArcHistory } from "./the-arc-browser";

type Props = {
  history: ArcHistory;
};

/**
 * The Arc with today's optimistic log count overlaid, so the chart and heatmap
 * react the instant the user logs. Needs the ritual log provider; archived
 * rituals render TheArcBrowser directly.
 */
export function TheArcLive({ history }: Props) {
  const { count } = useRitualLog();
  return <TheArcBrowser history={history} todayCount={count} />;
}
