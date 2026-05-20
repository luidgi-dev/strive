"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { logRitual, unlogRitual } from "@/app/[locale]/protected/(app)/rituals/actions";

type LogContextValue = {
  /** Optimistic count of completed logs for today. */
  count: number;
  isPending: boolean;
  /** Bumps on every log() call, used to replay the pulse animation. */
  pulseTick: number;
  ritualType: string;
  log: () => void;
  unlog: () => void;
};

const RitualLogContext = createContext<LogContextValue | null>(null);

export function useRitualLog(): LogContextValue {
  const ctx = useContext(RitualLogContext);
  if (!ctx) {
    throw new Error("useRitualLog must be used within a RitualLogProvider");
  }
  return ctx;
}

type Props = {
  ritualId: string;
  /** Today as YYYY-MM-DD, in the user's timezone. */
  today: string;
  /** Today's completed-log count from the server. */
  initialCount: number;
  ritualType: string;
  children: ReactNode;
};

export function RitualLogProvider({
  ritualId,
  today,
  initialCount,
  ritualType,
  children,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [count, applyDelta] = useOptimistic(
    initialCount,
    (state: number, delta: number) => Math.max(0, state + delta),
  );
  const [pulseTick, setPulseTick] = useState(0);

  const log = () => {
    setPulseTick((tick) => tick + 1);
    startTransition(async () => {
      applyDelta(1);
      await logRitual(ritualId, today);
    });
  };

  const unlog = () => {
    startTransition(async () => {
      applyDelta(-1);
      await unlogRitual(ritualId, today, ritualType === "one_time");
    });
  };

  return (
    <RitualLogContext.Provider
      value={{ count, isPending, pulseTick, ritualType, log, unlog }}
    >
      {children}
    </RitualLogContext.Provider>
  );
}
