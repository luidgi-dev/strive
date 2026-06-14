import { ChevronLeft, Minus, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { OneTimeStatus } from "@/components/rituals/one-time-status";
import { RitualCardActions } from "@/components/rituals/ritual-card-actions";
import { RitualLogControl } from "@/components/rituals/ritual-log-control";
import { RitualLogProvider } from "@/components/rituals/ritual-log-provider";
import { RitualMeta } from "@/components/rituals/ritual-meta";
import { TheArc } from "@/components/rituals/the-arc";
import { TheArcLive } from "@/components/rituals/the-arc-live";
import { Link } from "@/lib/i18n/navigation";
import { getUserToday } from "@/lib/profile";
import {
  rollingMomentumStatus,
  getLatestCompletedLog,
  getRitualArcLogs,
  getRitualDetail,
  getRitualProgress,
  getVisibleCategoriesForUser,
  type MomentumStatus,
} from "@/lib/data/rituals";
import { buildArcModel } from "@/lib/rituals/arc";
import { getCategoryLabel } from "@/lib/rituals/category-label";
import { isRitualFresh, ritualPeriodLabel } from "@/lib/rituals/presentation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ from?: string }>;
};

const ARC_LOOKBACK_DAYS = 90;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export default async function RitualDetailPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const { from } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("rituals");
  const tDetail = await getTranslations("rituals.detail");
  const format = await getFormatter();
  const supabase = await createClient();

  const ritual = await getRitualDetail(supabase, id);
  if (!ritual) notFound();

  const today = await getUserToday(supabase);

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
  const status = rollingMomentumStatus(
    progress,
    ritual.ritual_type,
    isRitualFresh(ritual.created_at),
  );

  // Archived rituals are viewable read-only: no log control, no edit/archive
  // menu, static Arc, and the back arrow returns to the archived screen.
  const isArchived = ritual.archived_at != null;
  // The back arrow returns to where the user came from. `from=flow` (set by the
  // Rhythm card) sends them back to Rhythm; archived rituals always return to the
  // archived screen; everything else defaults to the Rituals tab.
  const backHref =
    from === "flow"
      ? "/protected/flow"
      : isArchived
        ? "/protected/rituals/archived"
        : "/protected/rituals";
  const archivedLabel =
    isArchived && ritual.archived_at
      ? t("archived.archivedOn", {
          date: format.dateTime(new Date(ritual.archived_at), {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        })
      : null;

  function buildSubtitle(): string {
    const label = ritualPeriodLabel(ritual!, t);
    // One-time rituals append their due date to the base "One-time" label.
    if (ritual!.ritual_type === "one_time" && ritual!.due_date) {
      const date = format.dateTime(new Date(`${ritual!.due_date}T00:00:00`), {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return `${label} · ${date}`;
    }
    return label;
  }

  const content = (
    <div className="flex flex-col gap-4">
      <header className="-mx-2 flex items-center justify-between">
        <Link
          href={backHref}
          aria-label={tDetail("back")}
          className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
        {!isArchived ? (
          <RitualCardActions
            ritual={ritual}
            categories={categories}
            menuSide="bottom"
            redirectOnArchiveTo="/protected/rituals"
            triggerClassName="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent data-[popup-open]:bg-accent"
          />
        ) : null}
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
          {archivedLabel ? (
            <span className="text-[12px] font-medium leading-snug text-muted-foreground/70">
              {archivedLabel}
            </span>
          ) : null}
        </div>
        {!isArchived ? <RitualLogControl name={ritual.name} /> : null}
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

          {isArchived ? (
            <TheArc model={model} />
          ) : (
            <TheArcLive baseModel={model} today={today} />
          )}
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
  );

  // Active rituals need the log provider (control + optimistic Arc); archived
  // rituals are read-only, so the provider is skipped entirely.
  if (isArchived) return content;

  return (
    <RitualLogProvider
      ritualId={id}
      today={today}
      initialCount={initialLogCount}
      ritualType={ritual.ritual_type}
    >
      {content}
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
