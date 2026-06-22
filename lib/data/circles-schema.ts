import { z } from "zod";

/**
 * A circle's display name: trimmed, non-empty, and capped so it stays on one
 * line in the compact detail header. Shared by rename (LUI-66) and create
 * (LUI-64). Messages are error codes mapped to i18n keys by the caller.
 */
export const circleNameSchema = z
  .string()
  .trim()
  .min(1, "nameRequired")
  .max(60, "nameTooLong");

/**
 * Create-circle form values: a required name and an optional short note. Empty
 * notes are normalised to null in the DB (the create function trims + nullifs).
 */
export const circleCreateSchema = z.object({
  name: circleNameSchema,
  description: z.string().trim().max(280, "noteTooLong").optional(),
});

export type CircleCreateValues = z.infer<typeof circleCreateSchema>;
