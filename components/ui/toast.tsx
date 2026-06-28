"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastProps = {
  /** Leading glyph, shown in the accent circle (e.g. an icon). */
  icon: React.ReactNode;
  /** Toast body — plain text or rich content. */
  children: React.ReactNode;
  /** When provided, renders a dismiss button calling this handler. */
  onDismiss?: () => void;
  dismissLabel?: string;
  /** "status" for informational toasts, "alert" for assertive ones. */
  role?: "status" | "alert";
  className?: string;
};

/**
 * Presentational in-app toast: a fixed card near the top of the screen that
 * slides in. Stateless on purpose — callers own visibility, auto-dismiss timers
 * and content (see NudgeToaster and the feedback success toast).
 */
export function Toast({
  icon,
  children,
  onDismiss,
  dismissLabel,
  role = "status",
  className,
}: ToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-50 flex justify-center px-4">
      <div
        role={role}
        className={cn(
          "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-lg duration-300",
          className,
        )}
      >
        <span
          aria-hidden
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-foreground"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">
          {children}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
