import { notFound } from "next/navigation";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { CircleAvatarStack } from "@/components/circles/circle-avatar-stack";
import { CircleDetailHeader } from "@/components/circles/circle-detail-header";
import { CircleInviteButton } from "@/components/circles/circle-invite-button";
import { CircleSharedRitualsToggle } from "@/components/circles/circle-shared-rituals-toggle";
import { CircleWeeklyFeed } from "@/components/circles/circle-weekly-feed";
import {
  getCircleDetail,
  getCircleFeed,
  getCircleMomentum,
  getMyCircleRituals,
} from "@/lib/data/circles";
import { getUserToday } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

// Monday of the week containing `today` (YYYY-MM-DD), built and formatted in UTC
// so the "Week of …" label never shifts across the formatter's timezone.
function weekStartUtc(today: string): Date {
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isoDay = (date.getUTCDay() + 6) % 7; // 0 = Monday
  date.setUTCDate(date.getUTCDate() - isoDay);
  return date;
}

export default async function CircleDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("circles.detail");
  const format = await getFormatter();
  const supabase = await createClient();

  // Read the circle first: RLS returns nothing for non-members, so this 404s
  // before we fan out the heavier feed / rituals queries.
  const circle = await getCircleDetail(supabase, id);
  if (!circle) notFound();

  const [
    {
      data: { user },
    },
    feed,
    momentum,
    myRituals,
    today,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getCircleFeed(supabase, id),
    getCircleMomentum(supabase, id),
    getMyCircleRituals(supabase, id),
    getUserToday(supabase),
  ]);

  if (!user) notFound();

  const isOwner = circle.ownerId === user.id;
  const weekLabel = t("weekOf", {
    date: format.dateTime(weekStartUtc(today), {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }),
  });

  return (
    <div className="flex flex-col gap-[18px]">
      <CircleDetailHeader
        circleId={circle.id}
        circleName={circle.name}
        isOwner={isOwner}
      />

      <div className="flex flex-col gap-3 px-1 pb-1">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[22px] font-bold leading-tight tracking-tight text-foreground">
            {circle.name}
          </h1>
          {circle.description ? (
            <p className="truncate text-[13px] font-medium leading-snug text-muted-foreground">
              {circle.description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2.5">
          <CircleAvatarStack members={circle.members} />
          <span className="text-[12.5px] text-muted-foreground">
            {t("members", { count: circle.members.length })}
          </span>
          <CircleInviteButton />
        </div>
      </div>

      <CircleWeeklyFeed
        feed={feed}
        currentUserId={user.id}
        weekLabel={weekLabel}
        participantCount={momentum.participantCount}
        onTrackCount={momentum.onTrackCount}
      />

      <CircleSharedRitualsToggle circleId={circle.id} rituals={myRituals} />
    </div>
  );
}
