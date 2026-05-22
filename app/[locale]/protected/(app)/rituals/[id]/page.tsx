import { ChevronLeft, Minus, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { OneTimeStatus } from "@/components/rituals/one-time-status";
import { RitualCardActions } from "@/components/rituals/ritual-card-actions";
import { RitualLogControl } from "@/components/rituals/ritual-log-control";
import { RitualLogProvider } from "@/components/rituals/ritual-log-provider";
import { RitualMeta } from "@/components/rituals/ritual-meta";
import { TheArcLive } from "@/components/rituals/the-arc-live";
import { Link } from "@/lib/i18n/navigation";
import {
  deriveMomentumStatus,
  getLatestCompletedLog,
  getRitualArcLogs,
  getRitualDetail,
  getRitualProgress,
  getVisibleCategoriesForUser,
  type MomentumStatus,
} from "@/lib/data/rituals";
import { buildArcModel } from "@/lib/rituals/arc";
import { getCategoryLabel } from "@/lib/rituals/category-label";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string; id: string }> };

const ARC_LOOKBACK_DAYS = 90;

function todayInTimeZone(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export default async function RitualDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("rituals");
  const tDetail = await getTranslations("rituals.detail");
  const format = await getFormatter();
  const supabase = await createClient();

  const ritual = await getRitualDetail(supabase, id);
  if (!ritual) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .maybeSingle();
  const today = todayInTimeZone(profile?.timezone ?? "UTC");

  const [progress, logs, categories] = await Promise.all([
    getRitualProgress(supabase, id),
    getRitualArcLogs(supabase, id, isoDaysAgo(ARC_LOOKBACK_DAYS)),
    getVisibleCategoriesForUser(supabase),
  ]);

  const startedAt = ritual.started_at ?? ritual.created_at;
  const model = buildArcModel({
    logs,
    ritualType: ritual.ritual_type,
    frequencyUnit: ritual.frequency_unit,
    frequencyValue: ritual.frequency_value,
    today,
    startDate: startedAt,
  });

  const isOneTime = ritual.ritual_type === "one_time";
  const completedAt = isOneTime
    ? await getLatestCompletedLog(supabase, id)
    : null;

  // One-time logging is a single done flag; recurring/open count today's logs.
  const todayCount = logs.filter(
    (log) =>
      log.status_id === "completed" && log.logged_at?.slice(0, 10) === today,
  ).length;
  const initialLogCount = isOneTime ? (completedAt ? 1 : 0) : todayCount;

  const subtitle = buildSubtitle();
  const status = deriveMomentumStatus(
    ritual.ritual_type,
    progress?.completionRate ?? null,
  );

  function buildSubtitle(): string {
    if (ritual!.ritual_type === "one_time") {
      if (!ritual!.due_date) return t("type.oneTime");
      const date = format.dateTime(new Date(`${ritual!.due_date}T00:00:00`), {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return `${t("type.oneTime")} · ${date}`;
    }
    if (ritual!.ritual_type === "open") return t("type.open");

    const value = ritual!.frequency_value ?? 1;
    switch (ritual!.frequency_unit) {
      case "day":
        return t("frequency.daily");
      case "week":
        return t("frequency.weekly", { n: value });
      case "month":
        return t("frequency.monthly", { n: value });
      default:
        return t("type.open");
    }
  }

  return (
    <RitualLogProvider
      ritualId={id}
      today={today}
      initialCount={initialLogCount}
      ritualType={ritual.ritual_type}
    >
      <div className="flex flex-col gap-4">
        <header className="-mx-2 flex items-center justify-between">
          <Link
            href="/protected/rituals"
            aria-label={tDetail("back")}
            className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Link>
          <RitualCardActions
            ritual={ritual}
            categories={categories}
            menuSide="bottom"
            redirectOnArchiveTo="/protected/rituals"
            triggerClassName="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent data-[popup-open]:bg-accent"
          />
        </header>

        <div className="flex items-end justify-between gap-3 px-1 pb-1">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-heading text-[22px] font-bold leading-tight tracking-tight text-foreground">
              {ritual.name}
            </h1>
            <span className="text-[13px] font-medium leading-snug text-muted-foreground">
              {subtitle}
            </span>
            {ritual.description ? (
              <p className="text-[13px] leading-snug text-muted-foreground/80">
                {ritual.description}
              </p>
            ) : null}
          </div>
          <RitualLogControl name={ritual.name} />
        </div>

        {isOneTime ? (
          <OneTimeStatus
            dueDate={ritual.due_date}
            completedAt={completedAt}
            today={today}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {status ? (
                <KpiCard label={tDetail("momentum")}>
                  <span className="inline-flex items-center gap-1.5">
                    {t(`status.${status}`)}
                    <MomentumIcon status={status} />
                  </span>
                </KpiCard>
              ) : (
                <KpiCard label={tDetail("logged")}>{model.totalLogs}</KpiCard>
              )}
              <KpiCard label={tDetail("started")}>
                {format.dateTime(new Date(startedAt), { dateStyle: "medium" })}
              </KpiCard>
            </div>

            <TheArcLive baseModel={model} today={today} />
          </>
        )}

        <RitualMeta
          category={
            ritual.category
              ? getCategoryLabel(ritual.category, t, t("category.other"))
              : null
          }
          scheduledDays={ritual.scheduled_days}
          scheduledTime={ritual.scheduled_time}
        />
      </div>
    </RitualLogProvider>
  );
}

function KpiCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 pb-4 pt-3.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span className="font-heading text-[26px] font-bold leading-none tracking-tight text-foreground">
        {children}
      </span>
    </div>
  );
}

// Word stays in the default foreground; the colored arrow carries the read,
// driven by the momentum status (derived from completion_rate).
function MomentumIcon({ status }: { status: MomentumStatus }) {
  if (status === "strong") {
    return <TrendingUp aria-hidden className="size-4 text-momentum" />;
  }
  if (status === "steady") {
    return <TrendingUp aria-hidden className="size-4 text-caution" />;
  }
  return <Minus aria-hidden className="size-4 text-muted-foreground" />;
}
