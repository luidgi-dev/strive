// Shared demo seed data (LUI-43).
//
// Single source of truth for the demo account's rituals, the weekly logging
// pattern and the frozen Insight Cards. Imported by both the one-off seed script
// (scripts/seed-demo.ts) and the nightly demo-reset cron so the showcase stays
// internally consistent: the cron rebuilds the current week from the same
// pattern the seed used for the 10 weeks of history.

import { isoWeekday, startOfWeek } from "@/lib/date";

/** The demo account lives in a single, fixed timezone (English-only showcase). */
export const DEMO_TIMEZONE = "Europe/Paris";

/** Display name for the demo profile. */
export const DEMO_USERNAME = "Strive Demo";

/**
 * Weeks of history the seed builds behind the demo, so The Arc looks lived-in and
 * the monthly insights (12-week lookback) have enough data.
 */
export const DEMO_HISTORY_WEEKS = 12;

export type DemoRitualDef = {
  name: string;
  /** System category slug (see data/seeds/seed_ritual_categories.sql). */
  categorySlug: string;
  frequencyUnit: "day" | "week";
  frequencyValue: number;
  /**
   * ISO weekdays (1 = Monday … 7 = Sunday) this ritual targets. For daily rituals
   * it is the set of days it is typically logged in a healthy week; for weekly
   * rituals it is the scheduled days. Drives both the seeded history and the
   * nightly current-week rebuild.
   */
  days: number[];
  icon: string;
};

// Three daily rituals (Meditate / Read / Journaling) unlock the richer,
// non-obvious insight types (correlation, anchor_pair, adjustment), which need
// daily recurring rituals. The two weekly movement rituals are what the demo
// shares into the "Sport team" circle.
export const DEMO_RITUALS: DemoRitualDef[] = [
  {
    name: "Meditate",
    categorySlug: "balance",
    frequencyUnit: "day",
    frequencyValue: 1,
    days: [1, 2, 3, 4, 5, 6],
    icon: "🧘",
  },
  {
    name: "Read 30 min",
    categorySlug: "learning",
    frequencyUnit: "day",
    frequencyValue: 1,
    days: [1, 2, 3, 4, 5, 6, 7],
    icon: "📚",
  },
  {
    name: "Journaling",
    categorySlug: "creativity",
    frequencyUnit: "day",
    frequencyValue: 1,
    days: [1, 2, 3, 4, 5, 6, 7],
    icon: "✍️",
  },
  {
    name: "Morning run",
    categorySlug: "movement",
    frequencyUnit: "week",
    frequencyValue: 3,
    days: [1, 3, 5],
    icon: "🏃",
  },
  {
    name: "Strength training",
    categorySlug: "movement",
    frequencyUnit: "week",
    frequencyValue: 2,
    days: [2, 4],
    icon: "🏋️",
  },
];

/**
 * Daily rituals deliberately left unlogged for "today" by the nightly reset, so a
 * visitor lands on an actionable Rhythm (a few rituals still to log) rather than
 * an already-complete "done for today" screen.
 */
export const DEMO_TODAY_PENDING = ["Read 30 min", "Journaling"];

/** Movement rituals the demo owner shares into the "Sport team" circle. */
export const DEMO_CIRCLE_NAME = "Sport team";
export const DEMO_SHARED_RITUAL_NAMES = ["Morning run", "Strength training"];

/** Add `days` to a `YYYY-MM-DD` date (UTC), returning the same shape. */
export function addDaysIso(iso: string, days: number): string {
  const ms = Date.parse(`${iso}T00:00:00.000Z`) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The dates to log this week for a ritual with the given target `days`, capped at
 * `today` (we never log future days). When `skipToday` is set, today is left
 * unlogged so the ritual shows up as still-to-do on Rhythm. Returns `YYYY-MM-DD`.
 */
export function currentWeekLogDates(
  today: string,
  days: number[],
  skipToday = false,
): string[] {
  const monday = startOfWeek(today);
  const todayWeekday = isoWeekday(today);
  const cutoff = skipToday ? todayWeekday - 1 : todayWeekday;
  return days
    .filter((weekday) => weekday <= cutoff)
    .map((weekday) => addDaysIso(monday, weekday - 1));
}

export type DemoInsightCopy = { headline: string; body: string };

export type DemoInsight = {
  cadence: "weekly" | "monthly";
  type: "correlation" | "adjustment" | "strength" | "best_day" | "anchor_pair";
  /** Resolved to ritual_id at runtime by name; null for ritual-agnostic cards. */
  ritualName: string | null;
  confidence: number;
  basisWeeks: number;
  basisLabel: string;
  copy: { en: DemoInsightCopy; fr: DemoInsightCopy };
  payload: Record<string, unknown>;
};

// Frozen Insight Cards, captured from a one-off run of the REAL insights pipeline
// against the seeded demo history (scripts/generate-demo-insights.ts) so the copy
// and numbers are authentic. The nightly cron re-inserts these with a refreshed
// current-week period. Left empty until generated against prod — the cron simply
// skips the insights step while this is empty.
export const DEMO_INSIGHTS: DemoInsight[] = [
  {
    "cadence": "weekly",
    "type": "correlation",
    "ritualName": "Meditate",
    "confidence": 0.7263888888888889,
    "basisWeeks": 8,
    "basisLabel": "Last 8 weeks",
    "copy": {
      "en": {
        "headline": "Meditate and Journaling are linked.",
        "body": "On weeks when you log Meditate at least 5 days, your Journaling completion rate is 24% higher."
      },
      "fr": {
        "headline": "Meditate et Journaling sont liés.",
        "body": "Les semaines où tu enregistres Meditate au moins 5 jours, ton taux d'enregistrement pour Journaling est 24% plus élevé."
      }
    },
    "payload": {
      "ritualBId": "efb6153e-64f8-4153-9d60-6ba9b871087b",
      "baselineRate": 0.75,
      "highRate": 0.93,
      "effect": 0.24,
      "sampleSize": 6,
      "threshold": 5,
      "weeksObserved": 8,
      "basisWeeks": 8
    }
  },
  {
    "cadence": "weekly",
    "type": "anchor_pair",
    "ritualName": "Meditate",
    "confidence": 0.9142857142857143,
    "basisWeeks": 8,
    "basisLabel": "Last 8 weeks",
    "copy": {
      "en": {
        "headline": "Meditate and Journaling tend to pair.",
        "body": "You log Meditate and Journaling on the same day 76% of the time."
      },
      "fr": {
        "headline": "Meditate et Journaling tendent à s'associer.",
        "body": "Tu enregistres Meditate et Journaling le même jour 76% du temps."
      }
    },
    "payload": {
      "ritualBId": "efb6153e-64f8-4153-9d60-6ba9b871087b",
      "sharedDays": 37,
      "unionDays": 49,
      "rate": 0.76,
      "weeksObserved": 8,
      "basisWeeks": 8
    }
  },
  {
    "cadence": "weekly",
    "type": "adjustment",
    "ritualName": "Meditate",
    "confidence": 1,
    "basisWeeks": 4,
    "basisLabel": "Last 4 weeks",
    "copy": {
      "en": {
        "headline": "Your Sunday target may be too high.",
        "body": "Meditate completion drops 70% on Sundays vs. other weekdays. Consider lowering the target for that day."
      },
      "fr": {
        "headline": "Ton objectif du dimanche est peut-être trop élevé.",
        "body": "L'enregistrement de Meditate baisse de 70% les dimanches par rapport aux autres jours de la semaine. Tu pourrais envisager de baisser l'objectif pour ce jour."
      }
    },
    "payload": {
      "targetRitualId": "3f98b752-7413-4115-bb70-17c5dc747bab",
      "weekday": 0,
      "weekdayName": "Sunday",
      "dayRate": 0.25,
      "otherAvg": 0.83,
      "weeksObserved": 4,
      "basisWeeks": 4
    }
  },
  {
    "cadence": "weekly",
    "type": "strength",
    "ritualName": "Read 30 min",
    "confidence": 0.9375,
    "basisWeeks": 4,
    "basisLabel": "Last 4 weeks",
    "copy": {
      "en": {
        "headline": "Read 30 min is an anchor.",
        "body": "You log Read 30 min about 82% of the time, your steadiest ritual."
      },
      "fr": {
        "headline": "Read 30 min est un pilier.",
        "body": "Tu enregistres Read 30 min environ 82% du temps, ton rituel le plus stable."
      }
    },
    "payload": {
      "ratio": 0.82,
      "totalDays": 23,
      "weeksObserved": 4,
      "basisWeeks": 4
    }
  },
  {
    "cadence": "monthly",
    "type": "correlation",
    "ritualName": "Meditate",
    "confidence": 0.856845238095238,
    "basisWeeks": 12,
    "basisLabel": "Last 12 weeks",
    "copy": {
      "en": {
        "headline": "Journaling linked to Meditate.",
        "body": "On weeks when you log Meditate at least 5 days, your Journaling completion rate is 41% higher."
      },
      "fr": {
        "headline": "Journaling lié à Meditate.",
        "body": "Les semaines où tu enregistres Meditate au moins 5 jours, ton taux d'enregistrement de Journaling est 41% plus élevé."
      }
    },
    "payload": {
      "ritualBId": "efb6153e-64f8-4153-9d60-6ba9b871087b",
      "baselineRate": 0.67,
      "highRate": 0.94,
      "effect": 0.41,
      "sampleSize": 7,
      "threshold": 5,
      "weeksObserved": 12,
      "basisWeeks": 12
    }
  },
  {
    "cadence": "monthly",
    "type": "anchor_pair",
    "ritualName": "Meditate",
    "confidence": 0.881875,
    "basisWeeks": 12,
    "basisLabel": "Last 12 weeks",
    "copy": {
      "en": {
        "headline": "Meditate and Read 30 min tend to pair.",
        "body": "You log them on the same day 66% of the time."
      },
      "fr": {
        "headline": "Meditate et Read 30 min tendent à s'accompagner.",
        "body": "Tu les enregistres le même jour 66% du temps."
      }
    },
    "payload": {
      "ritualBId": "fb93d849-dfa5-492a-900c-cfec585cd0fc",
      "sharedDays": 53,
      "unionDays": 80,
      "rate": 0.66,
      "weeksObserved": 12,
      "basisWeeks": 12
    }
  },
  {
    "cadence": "monthly",
    "type": "adjustment",
    "ritualName": "Meditate",
    "confidence": 0.8833333333333333,
    "basisWeeks": 8,
    "basisLabel": "Last 8 weeks",
    "copy": {
      "en": {
        "headline": "Sunday Meditate target may be high.",
        "body": "Meditate completion drops 40% on Sundays compared to other weekdays. Consider adjusting your target for that day."
      },
      "fr": {
        "headline": "Ton objectif Meditate du dimanche élevé.",
        "body": "L'enregistrement de Meditate diminue de 40% les dimanches par rapport aux autres jours de la semaine. Tu pourrais envisager d'ajuster ton objectif pour ce jour."
      }
    },
    "payload": {
      "targetRitualId": "3f98b752-7413-4115-bb70-17c5dc747bab",
      "weekday": 0,
      "weekdayName": "Sunday",
      "dayRate": 0.5,
      "otherAvg": 0.83,
      "weeksObserved": 8,
      "basisWeeks": 8
    }
  },
  {
    "cadence": "monthly",
    "type": "strength",
    "ritualName": "Read 30 min",
    "confidence": 0.9312499999999999,
    "basisWeeks": 8,
    "basisLabel": "Last 8 weeks",
    "copy": {
      "en": {
        "headline": "Read 30 min is an anchor.",
        "body": "You log 'Read 30 min' 80% of the time, making it your most consistent ritual."
      },
      "fr": {
        "headline": "Read 30 min est ton ancre.",
        "body": "Tu enregistres 'Read 30 min' 80% du temps, ce qui en fait ton rituel le plus constant."
      }
    },
    "payload": {
      "ratio": 0.8,
      "totalDays": 45,
      "weeksObserved": 8,
      "basisWeeks": 8
    }
  }
];
