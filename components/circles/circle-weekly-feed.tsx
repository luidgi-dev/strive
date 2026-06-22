import { HeartHandshake } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CircleMomentumIndicator } from "@/components/circles/circle-momentum-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  CircleFeedMemberGroup,
  CircleFeedStatus,
} from "@/lib/data/circles";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<CircleFeedStatus, string> = {
  on_track: "bg-momentum",
  steady: "bg-caution",
  resting: "bg-muted-foreground",
};

function initial(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

// Others first (by name), self last, matching the wireframe ("you" at the foot).
function sortSelfLast(
  members: CircleFeedMemberGroup[],
  currentUserId: string,
): CircleFeedMemberGroup[] {
  return [...members].sort((a, b) => {
    const aSelf = a.userId === currentUserId;
    const bSelf = b.userId === currentUserId;
    if (aSelf !== bSelf) return aSelf ? 1 : -1;
    return (a.username ?? "").localeCompare(b.username ?? "");
  });
}

type Props = {
  feed: CircleFeedMemberGroup[];
  currentUserId: string;
  weekLabel: string;
  participantCount: number;
  onTrackCount: number;
};

/**
 * The weekly feed, grouped by member ("how is each person doing this week?").
 * Each member shows the rituals they share with their rolling momentum, plus one
 * nudge per person (a disabled placeholder until LUI-67). The header carries the
 * collective momentum so the page echoes the calm signal from the circles list.
 */
export async function CircleWeeklyFeed({
  feed,
  currentUserId,
  weekLabel,
  participantCount,
  onTrackCount,
}: Props) {
  const t = await getTranslations("circles");
  const tDetail = await getTranslations("circles.detail");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {weekLabel}
        </span>
        {participantCount > 0 ? (
          <CircleMomentumIndicator
            participantCount={participantCount}
            onTrackCount={onTrackCount}
          />
        ) : null}
      </div>

      {feed.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
          {tDetail("feedEmpty")}
        </p>
      ) : (
        sortSelfLast(feed, currentUserId).map((member) => {
          const isSelf = member.userId === currentUserId;
          return (
            <div key={member.userId} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 px-1">
                <Avatar size="sm">
                  {member.avatarUrl ? (
                    <AvatarImage src={member.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback>{initial(member.username)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate font-heading text-[14px] font-semibold tracking-[-0.005em] text-foreground">
                  {isSelf ? t("you") : member.username}
                </span>
                {isSelf ? null : (
                  <button
                    type="button"
                    disabled
                    aria-label={tDetail("nudge", {
                      name: member.username ?? "",
                    })}
                    className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground/60"
                  >
                    <HeartHandshake aria-hidden className="size-3.5" />
                  </button>
                )}
              </div>

              <ul className="overflow-hidden rounded-2xl border border-border bg-card">
                {member.rituals.map((ritual) => (
                  <li
                    key={ritual.ritualId}
                    className="flex items-center gap-3 border-b border-border px-3.5 py-3 last:border-b-0"
                  >
                    {ritual.icon ? (
                      <span aria-hidden className="text-[15px] leading-none">
                        {ritual.icon}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-foreground">
                      {ritual.name}
                    </span>
                    {ritual.target != null ? (
                      <span className="font-heading text-[14px] font-bold tracking-tight text-foreground">
                        {ritual.count ?? 0}
                        <span className="font-sans text-[12px] font-medium text-muted-foreground">
                          /{ritual.target}
                        </span>
                      </span>
                    ) : null}
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        STATUS_DOT[ritual.status],
                      )}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
