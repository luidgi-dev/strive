import { z } from "zod";

/**
 * Runtime schemas for the tool outputs the chat renders as cards. Tool outputs
 * arrive typed as `unknown` from the AI SDK, so each card dispatch `safeParse`s
 * the relevant shape before rendering. Keeping these in one place documents the
 * exact contract between `lib/ai/tools.ts` and the card components.
 */

export const momentumStatusSchema = z.enum(["strong", "steady", "resting"]);

export const periodSchema = z.enum(["week", "month"]);

export const momentumRitualSchema = z.object({
  name: z.string(),
  ritual_type: z.string(),
  logs_this_period: z.number().nullable(),
  target: z.number().nullable(),
  period: periodSchema.nullable(),
  momentum_status: momentumStatusSchema.nullable(),
  on_track: z.boolean().nullable(),
});

export const momentumSummarySchema = z.object({
  status: z.literal("ok"),
  rituals: z.array(momentumRitualSchema),
});

export const listRitualSchema = z.object({
  id: z.string(),
  name: z.string(),
  ritual_type: z.string(),
  period_label: z.enum(["daily", "weekly", "monthly", "one_time", "open"]),
  category: z.string().nullable(),
  momentum_status: momentumStatusSchema.nullable(),
});

export const listRitualsSchema = z.object({
  count: z.number(),
  category: z.string().nullable().optional(),
  rituals: z.array(listRitualSchema),
});

export const logMomentumSchema = z.object({
  logs_this_period: z.number().nullable(),
  target: z.number().nullable(),
  period: periodSchema.nullable(),
  status: momentumStatusSchema.nullable(),
});

export const logResultSchema = z.object({
  status: z.literal("ok"),
  logged: z.literal(true),
  log_id: z.string(),
  ritual_name: z.string(),
  date: z.string(),
  momentum: logMomentumSchema,
});

export const ambiguousSchema = z.object({
  status: z.literal("ambiguous"),
  candidates: z.array(z.object({ id: z.string(), name: z.string() })),
});

export type MomentumStatus = z.infer<typeof momentumStatusSchema>;
export type MomentumRitual = z.infer<typeof momentumRitualSchema>;
export type ListRitual = z.infer<typeof listRitualSchema>;
export type LogMomentum = z.infer<typeof logMomentumSchema>;
export type Ambiguous = z.infer<typeof ambiguousSchema>;

/** What the log card needs, produced both by the `log_ritual` tool and by `logRitualFromChat`. */
export type LogCardData = {
  log_id: string;
  ritual_name: string;
  date: string;
  momentum: LogMomentum;
};
