"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

/**
 * A pill toggle matching the design system. Visually 42x25 per the wireframe, with
 * an invisible padded hit area so the touch target clears 44px on mobile.
 */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-[25px] w-[42px] shrink-0 cursor-pointer items-center rounded-full p-[3px] outline-none transition-colors",
        "bg-muted-foreground/25 data-[checked]:bg-foreground",
        "before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-['']",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-default disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none size-[19px] rounded-full bg-card shadow-sm transition-transform",
          "data-[checked]:translate-x-[17px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
