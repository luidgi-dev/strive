import { getFormatter, getTranslations } from "next-intl/server";

import type { ArchivedRitualRow as ArchivedRitual } from "@/lib/data/rituals";
import { Link } from "@/lib/i18n/navigation";
import { getCategoryLabel } from "@/lib/rituals/category-label";

import { RestoreButton } from "./restore-button";

type Props = { ritual: ArchivedRitual };

export async function ArchivedRitualRow({ ritual }: Props) {
  const t = await getTranslations("rituals");
  const format = await getFormatter();

  const categoryLabel = ritual.category
    ? getCategoryLabel(ritual.category, t, t("category.other"))
    : null;
  const archivedOn = ritual.archived_at
    ? t("archived.archivedOn", {
        date: format.dateTime(new Date(ritual.archived_at), {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      })
    : null;
  const meta = [categoryLabel, archivedOn].filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card py-2 pl-3.5 pr-2">
      <Link
        href={`/protected/rituals/${ritual.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 py-1"
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-base text-muted-foreground"
        >
          {ritual.icon ?? "•"}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-heading text-sm font-semibold leading-tight tracking-tight">
            {ritual.name}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">{meta}</span>
        </span>
      </Link>
      <RestoreButton ritualId={ritual.id} />
    </div>
  );
}
