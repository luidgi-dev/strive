import { getTranslations } from "next-intl/server";

import { Link } from "@/lib/i18n/navigation";
import type { CircleOverview } from "@/lib/data/circles";

import { CircleAvatarStack } from "./circle-avatar-stack";
import { CircleMomentumIndicator } from "./circle-momentum-indicator";
import { CircleSharedRituals } from "./circle-shared-rituals";

const MAX_NAMES = 3;

type Props = {
  circle: CircleOverview;
  currentUserId: string | null;
};

/** Member names for the footer, with the current user shown as "you". */
function memberNames(
  circle: CircleOverview,
  currentUserId: string | null,
  youLabel: string,
): string {
  const names = circle.members
    .map((member) =>
      member.userId === currentUserId ? youLabel : member.username,
    )
    .filter((name): name is string => Boolean(name));
  const shown = names.slice(0, MAX_NAMES).join(" · ");
  const overflow = names.length - Math.min(MAX_NAMES, names.length);
  return overflow > 0 ? `${shown} +${overflow}` : shown;
}

/**
 * One circle in the list: identity (name + description + avatars), the shared
 * rituals it is built around, and a footer with member names and the collective
 * momentum. Links to the circle detail page.
 */
export async function CircleCard({ circle, currentUserId }: Props) {
  const t = await getTranslations("circles");

  return (
    <Link
      href={`/protected/circles/${circle.id}`}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-[18px] transition-colors hover:border-muted-foreground/30">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-[16px] font-semibold tracking-[-0.01em] text-foreground">
            {circle.name}
          </h3>
          {circle.description ? (
            <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted-foreground">
              {circle.description}
            </p>
          ) : null}
        </div>
        <CircleAvatarStack members={circle.members} />
      </div>

      {circle.sharedRituals.length > 0 ? (
        <CircleSharedRituals rituals={circle.sharedRituals} />
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
        <span className="min-w-0 truncate text-[12px] text-muted-foreground">
          {memberNames(circle, currentUserId, t("you"))}
        </span>
        {circle.participantCount > 0 ? (
          <CircleMomentumIndicator
            participantCount={circle.participantCount}
            onTrackCount={circle.onTrackCount}
          />
        ) : null}
      </div>
    </Link>
  );
}
