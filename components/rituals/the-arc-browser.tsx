"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";

import {
  applyOptimisticToday,
  arcWindowCount,
  buildArcModel,
  type BuildArcModelInput,
} from "@/lib/rituals/arc";
import { cn } from "@/lib/utils";

import { TheArc } from "./the-arc";

/** Everything needed to build any window: the whole history, as daily counts. */
export type ArcHistory = Omit<BuildArcModelInput, "offset" | "maxWeeks">;

type Props = {
  history: ArcHistory;
  /** Optimistic count for today while a log action is in flight (active rituals). */
  todayCount?: number;
};

/** Horizontal travel (px) before a drag counts as a swipe. */
const SWIPE_MIN_DX = 48;

/**
 * The Arc with navigation between 12-week windows (chevrons + swipe). Every
 * window is computed client-side from the full history, so moving is instant.
 */
export function TheArcBrowser({ history, todayCount }: Props) {
  const [offset, setOffset] = useState(0);
  // Which side the new window slides in from; null until the first move, so
  // the initial page load does not animate.
  const [direction, setDirection] = useState<"earlier" | "later" | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const windowCount = arcWindowCount(history);

  const model = useMemo(() => {
    const built = buildArcModel({ ...history, offset });
    return offset === 0 && todayCount !== undefined
      ? applyOptimisticToday(built, history.today, todayCount)
      : built;
  }, [history, offset, todayCount]);

  // The empty state is about the ritual, not the window: an old window with
  // no logs still shows its grid. Today's count may be optimistic.
  const isEmpty = useMemo(() => {
    const { counts, today } = history;
    const pastLogs = Object.entries(counts).some(
      ([date, count]) => date !== today && count > 0,
    );
    return !pastLogs && (todayCount ?? counts[today] ?? 0) === 0;
  }, [history, todayCount]);

  const canGoEarlier = offset < windowCount - 1;
  const canGoLater = offset > 0;

  function goEarlier() {
    if (!canGoEarlier) return;
    setDirection("earlier");
    setOffset((value) => value + 1);
  }

  function goLater() {
    if (!canGoLater) return;
    setDirection("later");
    setOffset((value) => value - 1);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse") return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // Mostly-horizontal drags only, so vertical scrolling is never hijacked.
    if (Math.abs(dx) < SWIPE_MIN_DX || Math.abs(dx) < Math.abs(dy) * 1.5)
      return;
    // Content follows the finger: dragging right reveals earlier weeks.
    if (dx > 0) goEarlier();
    else goLater();
  }

  const navigable = windowCount > 1 && !isEmpty;

  return (
    <div
      className={cn(navigable && "touch-pan-y")}
      onPointerDown={navigable ? onPointerDown : undefined}
      onPointerUp={navigable ? onPointerUp : undefined}
      onPointerCancel={() => (pointerStart.current = null)}
    >
      <TheArc
        // Remount per window: resets the selected week and replays the slide.
        key={offset}
        model={model}
        isEmpty={isEmpty}
        nav={
          navigable
            ? {
                canGoEarlier,
                canGoLater,
                onEarlier: goEarlier,
                onLater: goLater,
              }
            : undefined
        }
        className={cn(
          direction &&
            "animate-in fade-in duration-300 ease-out motion-reduce:animate-none",
          direction === "earlier" && "slide-in-from-left-4",
          direction === "later" && "slide-in-from-right-4",
        )}
      />
    </div>
  );
}
