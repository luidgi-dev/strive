import { z } from "zod";

const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const baseFields = {
  name: z.string().trim().min(1, "nameRequired").max(100, "nameTooLong"),
  icon: z.string().max(8).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
};

const recurringSchema = z.object({
  ...baseFields,
  ritual_type: z.literal("recurring"),
  frequency_unit: z.enum(["day", "week", "month"]),
  frequency_value: z.number().int().min(1).max(99),
  scheduled_days: z
    .array(z.number().int().min(1).max(7))
    .max(7)
    .nullable()
    .optional(),
  scheduled_time: z
    .string()
    .regex(TIME_REGEX, "timeInvalid")
    .nullable()
    .optional(),
});

const oneTimeSchema = z.object({
  ...baseFields,
  ritual_type: z.literal("one_time"),
  due_date: z.string().regex(DATE_REGEX, "dateInvalid"),
  scheduled_time: z
    .string()
    .regex(TIME_REGEX, "timeInvalid")
    .nullable()
    .optional(),
});

const openSchema = z.object({
  ...baseFields,
  ritual_type: z.literal("open"),
});

export const ritualFormSchema = z.discriminatedUnion("ritual_type", [
  recurringSchema,
  oneTimeSchema,
  openSchema,
]);

export type RitualFormValues = z.infer<typeof ritualFormSchema>;
export type RitualFormType = RitualFormValues["ritual_type"];

export const RITUAL_TYPES = ["recurring", "one_time", "open"] as const;
export const FREQUENCY_UNITS = ["day", "week", "month"] as const;
