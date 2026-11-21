"use client";

import type { VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

/**
 * A link styled as a Button. Lives in a client module because `buttonVariants`
 * does: a Server Component can render this but cannot call it directly.
 * Takes a ready-made href (no locale handling), so it also works outside the
 * next-intl provider.
 */
export function ButtonLink({ className, variant, size, ...props }: Props) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
