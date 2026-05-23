import type { MomentumStatus, RitualRow } from "@/lib/data/rituals";

/**
 * A next-intl translator scoped to the `rituals` namespace — server
 * `getTranslations("rituals")` or client `useTranslations("rituals")`. Supports
 * the interpolation values some labels need (e.g. `frequency.weekly`).
 */
type Translator = (key: string, values?: Record<string, string | number>) => string;

/**
 * The period/type label shown under a ritual's name ("Daily", "Weekly · 3×",
 * "One-time", "Open"). Single source for the rituals list, the Rhythm cards, and
 * the detail subtitle (which appends the due date itself).
 */
export function ritualPeriodLabel(
  ritual: Pick<RitualRow, "ritual_type" | "frequency_unit" | "frequency_value">,
  t: Translator,
): string {
  if (ritual.ritual_type === "one_time") return t("type.oneTime");
  if (ritual.ritual_type === "open") return t("type.open");

  const n = ritual.frequency_value ?? 1;
  switch (ritual.frequency_unit) {
    case "day":
      return t("frequency.daily");
    case "week":
      return t("frequency.weekly", { n });
    case "month":
      return t("frequency.monthly", { n });
    default:
      return t("type.open");
  }
}

/**
 * Token classes for a momentum status, in one place so the pill, the Rhythm
 * progress bar, and the detail KPI stay in sync. The bar uses a softer "resting"
 * fill than the dot, hence separate `dot` and `bar` entries.
 */
export const MOMENTUM_TOKENS: Record<
  MomentumStatus,
  { text: string; dot: string; bar: string }
> = {
  strong: { text: "text-momentum", dot: "bg-momentum", bar: "bg-momentum" },
  steady: { text: "text-caution", dot: "bg-caution", bar: "bg-caution" },
  resting: {
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    bar: "bg-muted-foreground/40",
  },
};

const FRESH_RITUAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Whether a ritual was created within the last 7 days — used to suppress a
 * momentum read while there isn't enough history. Stable within a single RSC
 * render (read of `Date.now()` is intentional and request-scoped).
 */
export function isRitualFresh(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < FRESH_RITUAL_WINDOW_MS;
}
