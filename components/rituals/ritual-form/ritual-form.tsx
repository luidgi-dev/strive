"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Smile } from "lucide-react";
import { useTranslations } from "next-intl";

import { safeError } from "@/lib/i18n/safe-error";
import { useState, useTransition } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
  type SubmitHandler,
} from "react-hook-form";

import {
  createRitual,
  updateRitual,
} from "@/app/[locale]/protected/(app)/rituals/actions";
import type { RitualCategoryRow } from "@/lib/data/rituals";
import {
  ritualFormSchema,
  type RitualFormValues,
} from "@/lib/data/rituals-schema";
import { cn } from "@/lib/utils";

import { CategoryChips } from "./category-chips";
import { DateField } from "./date-field";
import { EmojiGrid } from "./emoji-grid";
import { Segmented } from "./segmented";
import { Stepper } from "./stepper";
import { TimeField } from "./time-field";
import { WeekdayChips } from "./weekday-chips";

type Mode = "create" | "edit";

export type RitualFormInitialValues = RitualFormValues & { id?: string };

type Props = {
  mode: Mode;
  categories: RitualCategoryRow[];
  initialValues?: RitualFormInitialValues;
  onSuccess: () => void;
};

const DEFAULT_CREATE_VALUES: RitualFormValues = {
  ritual_type: "recurring",
  name: "",
  icon: null,
  description: null,
  category_id: null,
  frequency_unit: "week",
  frequency_value: 3,
  scheduled_days: null,
  scheduled_time: null,
};

export function RitualForm({
  mode,
  categories,
  initialValues,
  onSuccess,
}: Props) {
  const t = useTranslations("rituals.form");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const form = useForm<RitualFormValues>({
    resolver: zodResolver(ritualFormSchema),
    defaultValues: (initialValues ?? DEFAULT_CREATE_VALUES) as DefaultValues<RitualFormValues>,
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = form;

  const ritualType =
    useWatch({ control, name: "ritual_type" }) ?? "recurring";
  const frequencyUnitRaw = useWatch({ control, name: "frequency_unit" });
  const frequencyUnit =
    ritualType === "recurring" ? (frequencyUnitRaw ?? "week") : null;
  const scheduledDaysRaw = useWatch({ control, name: "scheduled_days" });
  const scheduledDays =
    ritualType === "recurring" ? (scheduledDaysRaw ?? null) : null;
  const scheduledTimeRaw = useWatch({ control, name: "scheduled_time" });
  const scheduledTime = ritualType !== "open" ? (scheduledTimeRaw ?? null) : null;
  const description = useWatch({ control, name: "description" }) ?? null;
  const icon = useWatch({ control, name: "icon" }) ?? null;

  const [iconOpen, setIconOpen] = useState<boolean>(false);
  const [noteOpen, setNoteOpen] = useState<boolean>(Boolean(description));
  const [daysOpen, setDaysOpen] = useState<boolean>(
    Boolean(scheduledDays && scheduledDays.length > 0),
  );
  const [timeOpen, setTimeOpen] = useState<boolean>(Boolean(scheduledTime));

  const switchType = (next: RitualFormValues["ritual_type"]) => {
    if (next === ritualType) return;

    const common = {
      name: getValues("name"),
      icon: getValues("icon"),
      description: getValues("description"),
      category_id: getValues("category_id"),
    };

    if (next === "recurring") {
      form.reset({
        ...common,
        ritual_type: "recurring",
        frequency_unit: "week",
        frequency_value: 3,
        scheduled_days: null,
        scheduled_time: null,
      });
    } else if (next === "one_time") {
      form.reset({
        ...common,
        ritual_type: "one_time",
        due_date: todayIso(),
        scheduled_time: null,
      });
    } else {
      form.reset({
        ...common,
        ritual_type: "open",
      });
    }

    setDaysOpen(false);
    setTimeOpen(false);
  };

  const switchFrequencyUnit = (next: "day" | "week" | "month") => {
    if (ritualType !== "recurring") return;
    setValue("frequency_unit", next, { shouldDirty: true });

    if (next === "day") {
      setValue("frequency_value", 1, { shouldDirty: true });
      setValue("scheduled_days", null, { shouldDirty: true });
      setDaysOpen(false);
    } else if (next === "week") {
      const current = getValues("frequency_value");
      if (!current || current < 1) {
        setValue("frequency_value", 3, { shouldDirty: true });
      }
    } else {
      const current = getValues("frequency_value");
      if (!current || current < 1) {
        setValue("frequency_value", 4, { shouldDirty: true });
      }
      setValue("scheduled_days", null, { shouldDirty: true });
      setDaysOpen(false);
    }
  };

  const onSubmit: SubmitHandler<RitualFormValues> = (values) => {
    setActionError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRitual(values)
          : await updateRitual(initialValues?.id ?? "", values);

      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      onSuccess();
    });
  };

  const typeOptions = [
    { value: "recurring" as const, label: t("type.recurring") },
    { value: "one_time" as const, label: t("type.oneTime") },
    { value: "open" as const, label: t("type.open") },
  ];

  const cadenceOptions = [
    { value: "day" as const, label: t("cadence.daily") },
    { value: "week" as const, label: t("cadence.weekly") },
    { value: "month" as const, label: t("cadence.monthly") },
  ];

  const targetUnit =
    frequencyUnit === "week"
      ? t("target.unit.week")
      : frequencyUnit === "month"
        ? t("target.unit.month")
        : "";

  const ctaLabel = mode === "create" ? t("actions.create") : t("actions.save");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {/* Icon + Name row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => setIconOpen((v) => !v)}
            aria-label={t("icon.toggle")}
            aria-expanded={iconOpen}
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-lg border bg-accent text-xl transition-colors",
              iconOpen
                ? "border-foreground/35 bg-card"
                : "border-transparent hover:bg-foreground/5",
            )}
          >
            {icon ? (
              <span aria-hidden>{icon}</span>
            ) : (
              <Smile aria-hidden className="size-5 text-muted-foreground" strokeWidth={1.75} />
            )}
          </button>
          <input
            {...register("name")}
            aria-label={t("fields.name")}
            placeholder={t("placeholders.name")}
            autoComplete="off"
            className="flex-1 rounded-lg border border-transparent bg-accent px-3.5 py-3 text-base font-medium text-foreground outline-none focus:border-foreground/35 focus:bg-card placeholder:text-muted-foreground"
          />
        </div>
        {errors.name?.message ? (
          <p className="text-xs text-destructive">{safeError(t, errors.name.message)}</p>
        ) : null}
        {iconOpen ? (
          <EmojiGrid
            value={icon}
            onChange={(next) => {
              setValue("icon", next, { shouldDirty: true });
              setIconOpen(false);
            }}
          />
        ) : null}
      </div>

      {/* Type */}
      <FieldGroup label={t("fields.type")}>
        <Controller
          control={control}
          name="ritual_type"
          render={({ field }) => (
            <Segmented
              value={field.value}
              onChange={switchType}
              options={typeOptions}
              ariaLabel={t("fields.type")}
            />
          )}
        />
      </FieldGroup>

      {/* Recurring branch */}
      {ritualType === "recurring" ? (
        <>
          <FieldGroup label={t("fields.cadence")}>
            <Controller
              control={control}
              name="frequency_unit"
              render={({ field }) => (
                <Segmented
                  value={field.value}
                  onChange={switchFrequencyUnit}
                  options={cadenceOptions}
                  ariaLabel={t("fields.cadence")}
                />
              )}
            />
          </FieldGroup>

          {frequencyUnit !== "day" ? (
            <FieldGroup label={t("fields.target")}>
              <div className="flex items-center gap-3">
                <Controller
                  control={control}
                  name="frequency_value"
                  render={({ field }) => (
                    <Stepper
                      value={field.value ?? 1}
                      onChange={field.onChange}
                      min={1}
                      max={99}
                      ariaLabel={t("fields.target")}
                      decreaseLabel={t("target.decrease")}
                      increaseLabel={t("target.increase")}
                    />
                  )}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {targetUnit}
                </span>
              </div>
            </FieldGroup>
          ) : null}

          {frequencyUnit === "week" ? (
            <OptToggle
              open={daysOpen}
              onOpen={() => setDaysOpen(true)}
              label={t("days.toggle")}
            >
              <Controller
                control={control}
                name="scheduled_days"
                render={({ field }) => (
                  <WeekdayChips
                    value={field.value ?? []}
                    onChange={(next) =>
                      field.onChange(next.length === 0 ? null : next)
                    }
                  />
                )}
              />
            </OptToggle>
          ) : null}

          <OptToggle
            open={timeOpen}
            onOpen={() => setTimeOpen(true)}
            label={t("time.toggle")}
          >
            <Controller
              control={control}
              name="scheduled_time"
              render={({ field }) => (
                <TimeField
                  value={field.value ?? ""}
                  onChange={(next) => field.onChange(next || null)}
                  ariaLabel={t("fields.time")}
                />
              )}
            />
          </OptToggle>
        </>
      ) : null}

      {/* One-time branch */}
      {ritualType === "one_time" ? (
        <>
          <FieldGroup label={t("fields.date")}>
            <Controller
              control={control}
              name="due_date"
              render={({ field }) => (
                <DateField
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  ariaLabel={t("fields.date")}
                />
              )}
            />
          </FieldGroup>

          <OptToggle
            open={timeOpen}
            onOpen={() => setTimeOpen(true)}
            label={t("time.toggle")}
          >
            <Controller
              control={control}
              name="scheduled_time"
              render={({ field }) => (
                <TimeField
                  value={field.value ?? ""}
                  onChange={(next) => field.onChange(next || null)}
                  ariaLabel={t("fields.time")}
                />
              )}
            />
          </OptToggle>
        </>
      ) : null}

      {/* Category */}
      <FieldGroup label={t("fields.category")}>
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <CategoryChips
              value={field.value ?? null}
              onChange={field.onChange}
              categories={categories}
            />
          )}
        />
      </FieldGroup>

      {/* Description */}
      <OptToggle
        open={noteOpen}
        onOpen={() => setNoteOpen(true)}
        label={t("note.toggle")}
      >
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <textarea
              value={field.value ?? ""}
              onChange={(event) => field.onChange(event.target.value || null)}
              placeholder={t("placeholders.note")}
              aria-label={t("fields.note")}
              rows={3}
              className="w-full rounded-lg border border-transparent bg-accent px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground/35 focus:bg-card placeholder:text-muted-foreground"
            />
          )}
        />
      </OptToggle>

      {actionError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {safeError(t, actionError)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "mt-2 w-full rounded-full bg-foreground px-4 py-3 text-sm font-bold text-background transition-opacity",
          isPending ? "opacity-60" : "hover:opacity-90",
        )}
      >
        {isPending ? t("actions.saving") : ctaLabel}
      </button>
    </form>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function OptToggle({
  open,
  onOpen,
  label,
  children,
}: {
  open: boolean;
  onOpen: () => void;
  label: string;
  children: React.ReactNode;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-1.5 self-start px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Plus aria-hidden className="size-3" strokeWidth={2} />
        {label}
      </button>
    );
  }
  return <div className="flex flex-col gap-2">{children}</div>;
}

function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
