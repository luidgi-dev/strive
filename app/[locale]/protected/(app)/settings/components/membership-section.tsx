"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Tier = "lite" | "premium" | "lifetime";
type PaidTier = Exclude<Tier, "lite">;

type Props = {
  tier?: Tier;
  balance?: number;
  quota?: number;
  resetAt?: string | Date | null;
};

function nextResetFallback(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

export function MembershipSection({
  tier = "lite",
  balance = 5,
  quota = 5,
  resetAt,
}: Props) {
  const t = useTranslations("settings.membership");
  const locale = useLocale();

  const resetDate = useMemo(() => {
    if (!resetAt) return nextResetFallback();
    return resetAt instanceof Date ? resetAt : new Date(resetAt);
  }, [resetAt]);

  const resetLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: "long", day: "numeric" }).format(
        resetDate,
      ),
    [locale, resetDate],
  );

  const tierLabel =
    tier === "premium"
      ? t("tierPremium")
      : tier === "lifetime"
        ? t("tierLifetime")
        : t("tierLite");

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {t("label")}
      </h2>

      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <span className="text-sm">{t("plan")}</span>
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {tierLabel}
        </span>
      </div>
      <div className="h-px bg-border" aria-hidden />

      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <span className="text-sm">{t("credits")}</span>
        <span className="text-sm text-muted-foreground">
          {t("creditsValue", { remaining: balance, total: quota })}
        </span>
      </div>
      <div className="h-px bg-border" aria-hidden />

      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <span className="text-sm">{t("resetsOn")}</span>
        <span className="text-sm text-muted-foreground">{resetLabel}</span>
      </div>

      {/* Insights is a premium surface: the link only appears for paid tiers. */}
      {tier !== "lite" ? (
        <>
          <div className="h-px bg-border" aria-hidden />
          <Link
            href="/protected/settings/insights"
            className="flex min-h-[44px] items-center justify-between gap-3 text-sm text-foreground transition-colors hover:text-muted-foreground"
          >
            <span>{t("myInsights")}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </>
      ) : null}

      <PlansLink currentTier={tier} />
    </section>
  );
}

function PlansLink({ currentTier }: { currentTier: Tier }) {
  const t = useTranslations("settings.membership");

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            className="mt-2 inline-flex h-11 items-center justify-center gap-1 self-center px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("viewPlans")}
            <ChevronRight className="size-3.5" />
          </button>
        }
      />
      <UnlockSheetBody currentTier={currentTier} />
    </Sheet>
  );
}

function UnlockSheetBody({ currentTier }: { currentTier: Tier }) {
  const t = useTranslations("settings.unlockSheet");
  const [selected, setSelected] = useState<PaidTier>(
    currentTier === "lifetime" ? "lifetime" : "premium",
  );

  const tiers: TierCardData[] = [
    {
      id: "lite",
      label: t("liteLabel"),
      price: t("litePrice"),
      tagline: t("liteTagline"),
      bullets: [t("liteBullet1"), t("liteBullet2"), t("liteBullet3")],
    },
    {
      id: "premium",
      label: t("premiumLabel"),
      price: t("premiumPrice"),
      tagline: t("premiumTagline"),
      bullets: [t("premiumBullet1"), t("premiumBullet2"), t("premiumBullet3")],
    },
    {
      id: "lifetime",
      label: t("lifetimeLabel"),
      price: t("lifetimePrice"),
      tagline: t("lifetimeTagline"),
      bullets: [
        t("lifetimeBullet1"),
        t("lifetimeBullet2"),
        t("lifetimeBullet3"),
      ],
    },
  ];

  return (
    <SheetContent>
      <div className="flex flex-col gap-1.5">
        <SheetTitle>{t("title")}</SheetTitle>
        <SheetDescription>{t("subtitle")}</SheetDescription>
      </div>

      <div className="flex flex-col gap-2">
        {tiers.map((card) => (
          <TierCard
            key={card.id}
            data={card}
            isCurrent={card.id === currentTier}
            isSelected={card.id !== "lite" && card.id === selected}
            onSelect={
              card.id === "lite"
                ? undefined
                : () => setSelected(card.id as PaidTier)
            }
          />
        ))}
      </div>

      <Button type="button" variant="default" disabled className="h-11 w-full">
        {t("continue")}
      </Button>
    </SheetContent>
  );
}

type TierCardData = {
  id: Tier;
  label: string;
  price: string;
  tagline: string;
  bullets: string[];
};

function TierCard({
  data,
  isCurrent,
  isSelected,
  onSelect,
}: {
  data: TierCardData;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect?: () => void;
}) {
  const tMembership = useTranslations("settings.membership");
  const selectable = !!onSelect;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!selectable}
      aria-pressed={selectable ? isSelected : undefined}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 text-left transition-colors",
        "disabled:cursor-default",
        isSelected
          ? "border-foreground bg-muted"
          : "border-border",
        selectable && !isSelected && "hover:border-muted-foreground/40",
        !selectable && "opacity-70",
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-semibold tracking-tight">
              {data.label}
            </span>
            {isCurrent ? (
              <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {tMembership("currentPlan")}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">{data.tagline}</span>
        </div>
        <span className="shrink-0 text-xs font-medium text-foreground">
          {data.price}
        </span>
      </div>

      <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        {data.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span aria-hidden className="select-none leading-5">·</span>
            <span className="leading-5">{b}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
