import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** A pulsing placeholder block for loading states (shadcn-style). */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
