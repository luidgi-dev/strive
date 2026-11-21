import Image from "next/image";

import { cn } from "@/lib/utils";

type Props = { size: number; className?: string };

/** App icon in the variant matching the theme (both rendered, CSS picks one). */
export function StriveLogo({ size, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-lg border border-border/70",
        className,
      )}
    >
      <Image
        src="/strive-app-dark.svg"
        alt="Strive"
        width={size}
        height={size}
        className="hidden dark:block"
      />
      <Image
        src="/strive-app-light.svg"
        alt="Strive"
        width={size}
        height={size}
        className="block dark:hidden"
      />
    </span>
  );
}
