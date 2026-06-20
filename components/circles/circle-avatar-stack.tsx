"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import type { CircleMemberPreview } from "@/lib/data/circles";

const MAX_VISIBLE = 3;

function initial(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

type Props = {
  members: CircleMemberPreview[];
};

/** Overlapping member avatars (up to 3) then a "+N" count, per the wireframe. */
export function CircleAvatarStack({ members }: Props) {
  const visible = members.slice(0, MAX_VISIBLE);
  const overflow = members.length - visible.length;

  return (
    <AvatarGroup>
      {visible.map((member) => (
        <Avatar key={member.userId}>
          {member.avatarUrl ? (
            <AvatarImage src={member.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback>{initial(member.username)}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 ? <AvatarGroupCount>+{overflow}</AvatarGroupCount> : null}
    </AvatarGroup>
  );
}
