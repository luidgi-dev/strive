import { tool, type ToolSet } from "ai";
import { z } from "zod";

import {
  deriveMomentumStatus,
  getRitualProgress,
  getRitualsForActiveUser,
  insertRitual,
  insertRitualLog,
  type MomentumStatus,
} from "@/lib/data/rituals";
import {
  FREQUENCY_UNITS,
  RITUAL_TYPES,
  ritualFormSchema,
  type RitualFormValues,
} from "@/lib/data/rituals-schema";
import { ensureProfile, getUserToday } from "@/lib/profile";
import { isRitualFresh } from "@/lib/rituals/presentation";
import type { StriveSupabaseClient } from "@/lib/ai/types";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type PeriodLabel = "daily" | "weekly" | "monthly" | "one_time" | "open";

/** Structured, locale-neutral period descriptor — the LLM phrases it in the user's language. */
function describePeriod(
  ritualType: string,
  frequencyUnit: string | null,
): { period: string | null; period_label: PeriodLabel } {
  if (ritualType === "one_time") return { period: null, period_label: "one_time" };
  if (ritualType === "open") return { period: null, period_label: "open" };
  const period_label: PeriodLabel =
    frequencyUnit === "day"
      ? "daily"
      : frequencyUnit === "month"
        ? "monthly"
        : "weekly";
  return { period: frequencyUnit, period_label };
}

/**
 * Momentum status mirroring the Rhythm card: suppressed (null) for a brand-new
 * ritual with no logs yet, otherwise derived from the completion rate (null for
 * non-recurring rituals).
 */
function deriveStatus(
  ritualType: string,
  completionRate: number | null,
  logsThisPeriod: number | null,
  createdAt: string,
): MomentumStatus | null {
  if ((logsThisPeriod ?? 0) === 0 && isRitualFresh(createdAt)) return null;
  return deriveMomentumStatus(ritualType, completionRate);
}

/**
 * Whether the user is keeping pace this period. Only meaningful for recurring
 * rituals: the `ritual_progress` view counts `logs_this_period` against today
 * for non-recurring rituals, so a one_time done earlier would wrongly read as
 * off-track. Returns null for open/one_time (and for fresh, status-suppressed
 * recurring rituals).
 */
function deriveOnTrack(
  ritualType: string,
  status: MomentumStatus | null,
): boolean | null {
  if (ritualType !== "recurring") return null;
  if (status === null) return null;
  return status !== "resting";
}

type ResolvedRitual = {
  id: string;
  name: string;
  ritual_type: string;
  frequency_value: number | null;
  frequency_unit: string | null;
  created_at: string;
};

type NameResolution =
  | { status: "ok"; ritual: ResolvedRitual }
  | { status: "not_found"; query: string }
  | { status: "ambiguous"; candidates: { id: string; name: string }[] };

/**
 * Resolve a user-supplied ritual name to a single active ritual. Tries a
 * case-insensitive exact match first, then a substring match ("run" → "Running").
 * Returns a structured result so the agent can ask the user to disambiguate.
 */
async function resolveRitualByName(
  supabase: StriveSupabaseClient,
  userId: string,
  rawQuery: string,
): Promise<NameResolution> {
  const query = rawQuery.trim();
  const select = "id, name, ritual_type, frequency_value, frequency_unit, created_at";
  const baseQuery = () =>
    supabase
      .from("rituals")
      .select(select)
      .eq("user_id", userId)
      .eq("is_active", true)
      .is("archived_at", null);

  const exact = await baseQuery().ilike("name", query);
  if (exact.error) throw exact.error;
  if (exact.data && exact.data.length === 1) {
    return { status: "ok", ritual: exact.data[0] };
  }
  if (exact.data && exact.data.length > 1) {
    return {
      status: "ambiguous",
      candidates: exact.data.map((r) => ({ id: r.id, name: r.name })),
    };
  }

  const like = await baseQuery().ilike("name", `%${query}%`);
  if (like.error) throw like.error;
  const rows = like.data ?? [];
  if (rows.length === 1) return { status: "ok", ritual: rows[0] };
  if (rows.length === 0) return { status: "not_found", query };
  return {
    status: "ambiguous",
    candidates: rows.map((r) => ({ id: r.id, name: r.name })),
  };
}

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/**
 * The tool set available to the Strive agent, with the Supabase client and
 * verified user id already bound (server-side context).
 *
 * Conventions:
 * - Every tool acts on `userId` (never an id derived from the conversation);
 *   new queries filter by `user_id` explicitly on top of RLS.
 * - Expected outcomes (not found / ambiguous / validation) are returned as
 *   structured `{ status }` objects so the model can clarify; genuine DB errors
 *   throw and surface via the system prompt's failure copy.
 */
export function striveTools(
  supabase: StriveSupabaseClient,
  userId: string,
): ToolSet {
  return {
    list_rituals: tool({
      description:
        "List the user's active rituals. Also useful to discover ritual names before logging or asking about momentum.",
      inputSchema: z.object({}),
      execute: async () => {
        const { rituals, progressByRitualId } =
          await getRitualsForActiveUser(supabase);
        return {
          count: rituals.length,
          rituals: rituals.map((r) => {
            const progress = progressByRitualId.get(r.id);
            const { period, period_label } = describePeriod(
              r.ritual_type,
              r.frequency_unit,
            );
            return {
              id: r.id,
              name: r.name,
              ritual_type: r.ritual_type,
              frequency_value: r.frequency_value,
              frequency_unit: r.frequency_unit,
              period,
              period_label,
              category: r.category?.name ?? null,
              momentum_status: deriveStatus(
                r.ritual_type,
                progress?.completionRate ?? null,
                progress?.logsThisPeriod ?? null,
                r.created_at,
              ),
            };
          }),
        };
      },
    }),

    get_momentum_summary: tool({
      description:
        "Retrieve the user's current momentum for all active rituals, or a single one if ritual_name is given.",
      inputSchema: z.object({
        ritual_name: z
          .string()
          .optional()
          .describe(
            "Optional. The name of one ritual to focus on. Omit to summarise every active ritual.",
          ),
      }),
      execute: async ({ ritual_name }) => {
        const { rituals, progressByRitualId } =
          await getRitualsForActiveUser(supabase);

        let scoped = rituals;
        if (ritual_name) {
          const resolution = await resolveRitualByName(
            supabase,
            userId,
            ritual_name,
          );
          if (resolution.status !== "ok") return resolution;
          scoped = rituals.filter((r) => r.id === resolution.ritual.id);
        }

        return {
          status: "ok" as const,
          rituals: scoped.map((r) => {
            const progress = progressByRitualId.get(r.id);
            const logs_this_period = progress?.logsThisPeriod ?? null;
            const { period } = describePeriod(r.ritual_type, r.frequency_unit);
            const momentum_status = deriveStatus(
              r.ritual_type,
              progress?.completionRate ?? null,
              logs_this_period,
              r.created_at,
            );
            return {
              name: r.name,
              ritual_type: r.ritual_type,
              logs_this_period,
              target: progress?.target ?? null,
              period,
              momentum_status,
              on_track: deriveOnTrack(r.ritual_type, momentum_status),
            };
          }),
        };
      },
    }),

    log_ritual: tool({
      description:
        "Log a ritual as completed, for today or a past date. The ritual is identified by name.",
      inputSchema: z.object({
        ritual_name: z
          .string()
          .describe("The name of the ritual to log (resolved case-insensitively)."),
        logged_at: z
          .string()
          .regex(DATE_REGEX)
          .optional()
          .describe(
            "Date to log, YYYY-MM-DD. Defaults to today in the user's timezone. Use for 'yesterday' etc.",
          ),
        note: z
          .string()
          .max(1000)
          .optional()
          .describe("Optional short note to attach to this log entry."),
      }),
      execute: async ({ ritual_name, logged_at, note }) => {
        const resolution = await resolveRitualByName(supabase, userId, ritual_name);
        if (resolution.status !== "ok") return resolution;
        const ritual = resolution.ritual;

        const date = logged_at ?? (await getUserToday(supabase));

        await ensureProfile(supabase, { id: userId });
        await insertRitualLog(supabase, {
          ritualId: ritual.id,
          userId,
          loggedAt: date,
          note,
        });

        const progress = await getRitualProgress(supabase, ritual.id);
        const logs_this_period = progress?.logsThisPeriod ?? null;
        const { period } = describePeriod(ritual.ritual_type, ritual.frequency_unit);

        return {
          status: "ok" as const,
          logged: true,
          ritual_name: ritual.name,
          date,
          momentum: {
            logs_this_period,
            target: progress?.target ?? null,
            period,
            status: deriveStatus(
              ritual.ritual_type,
              progress?.completionRate ?? null,
              logs_this_period,
              ritual.created_at,
            ),
          },
        };
      },
    }),

    create_ritual: tool({
      description: "Create a new ritual for the user.",
      inputSchema: z.object({
        name: z.string().min(1).max(100).describe("The ritual name."),
        ritual_type: z
          .enum(RITUAL_TYPES)
          .describe(
            "'recurring' (repeats on a frequency), 'one_time' (has a due date), or 'open' (log anytime, no target).",
          ),
        frequency_value: z
          .number()
          .int()
          .min(1)
          .max(99)
          .optional()
          .describe("Required for recurring: how many times per unit, e.g. 3."),
        frequency_unit: z
          .enum(FREQUENCY_UNITS)
          .optional()
          .describe("Required for recurring: 'day' | 'week' | 'month'."),
        due_date: z
          .string()
          .regex(DATE_REGEX)
          .optional()
          .describe("Required for one_time: the due date, YYYY-MM-DD."),
        category_name: z
          .string()
          .optional()
          .describe(
            "Optional existing category name, matched case-insensitively. Unknown categories are ignored, not created.",
          ),
      }),
      execute: async ({
        name,
        ritual_type,
        frequency_value,
        frequency_unit,
        due_date,
        category_name,
      }) => {
        // Resolve the category name to an existing active category (system or
        // the user's own). Unknown → uncategorised; never auto-created.
        let category_id: string | null = null;
        let category: string | null = null;
        if (category_name?.trim()) {
          const { data, error } = await supabase
            .from("ritual_categories")
            .select("id, name")
            .eq("is_active", true)
            .ilike("name", category_name.trim());
          if (error) throw error;
          if (data && data.length === 1) {
            category_id = data[0].id;
            category = data[0].name;
          }
        }

        // Build form values, enforcing the same type-specific rules as the DB.
        let values: RitualFormValues;
        if (ritual_type === "recurring") {
          if (frequency_value == null || frequency_unit == null) {
            return {
              status: "validation" as const,
              message:
                "Recurring rituals need a frequency value and unit (e.g. 3 times per week).",
            };
          }
          values = {
            name,
            ritual_type,
            frequency_value,
            frequency_unit,
            category_id,
          };
        } else if (ritual_type === "one_time") {
          if (!due_date) {
            return {
              status: "validation" as const,
              message: "One-time rituals need a due date (YYYY-MM-DD).",
            };
          }
          values = { name, ritual_type, due_date, category_id };
        } else {
          values = { name, ritual_type, category_id };
        }

        const parsed = ritualFormSchema.safeParse(values);
        if (!parsed.success) {
          return {
            status: "validation" as const,
            message: parsed.error.issues[0]?.message ?? "Invalid ritual.",
          };
        }

        await ensureProfile(supabase, { id: userId });
        const { id } = await insertRitual(supabase, parsed.data, userId);

        const { period_label } = describePeriod(ritual_type, frequency_unit ?? null);
        return {
          status: "ok" as const,
          created: true,
          ritual_id: id,
          name,
          ritual_type,
          frequency_value: frequency_value ?? null,
          frequency_unit: frequency_unit ?? null,
          due_date: due_date ?? null,
          category,
          category_matched: category_id !== null,
          period_label,
        };
      },
    }),

    get_log_history: tool({
      description:
        "Retrieve the log history for a specific ritual, optionally within a date range.",
      inputSchema: z.object({
        ritual_name: z
          .string()
          .describe("The name of the ritual whose history to retrieve."),
        from_date: z
          .string()
          .regex(DATE_REGEX)
          .optional()
          .describe("Inclusive start date, YYYY-MM-DD."),
        to_date: z
          .string()
          .regex(DATE_REGEX)
          .optional()
          .describe("Inclusive end date, YYYY-MM-DD."),
      }),
      execute: async ({ ritual_name, from_date, to_date }) => {
        const resolution = await resolveRitualByName(supabase, userId, ritual_name);
        if (resolution.status !== "ok") return resolution;
        const ritual = resolution.ritual;

        let query = supabase
          .from("ritual_log_history")
          .select("logged_at, status_id, note")
          .eq("user_id", userId)
          .eq("ritual_id", ritual.id)
          .order("logged_at", { ascending: false });
        if (from_date) query = query.gte("logged_at", from_date);
        if (to_date) query = query.lte("logged_at", to_date);

        const { data, error } = await query;
        if (error) throw error;

        const logs = (data ?? []).map((r) => ({
          date: r.logged_at,
          status: r.status_id,
          note: r.note,
        }));
        return {
          status: "ok" as const,
          ritual_name: ritual.name,
          count: logs.length,
          logs,
        };
      },
    }),
  };
}
