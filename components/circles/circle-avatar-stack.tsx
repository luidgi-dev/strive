"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { memberInitial, type CircleMemberPreview } from "@/lib/data/circles";

const MAX_VISIBLE = 3;

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
          <AvatarFallback>{memberInitial(member.username)}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 ? <AvatarGroupCount>+{overflow}</AvatarGroupCount> : null}
    </AvatarGroup>
  );
}
