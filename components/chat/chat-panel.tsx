"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { StriveAiFab } from "@/components/ui/strive-ai-fab";
import { usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

import { StriveChat } from "./strive-chat";

// Render only on the client to avoid a hydration mismatch on the portal.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Mounts the AI chat: the FAB opens a floating glass panel anchored above it,
 * with the Rhythm dashboard blurred behind (per design/wireframes/ai-chat.html).
 * Owns the open state, the client-only guard, and the settings-page hiding that
 * previously lived in the FAB. Built on base-ui Dialog for focus-trap / Escape /
 * dismiss, but styled as a floating bubble rather than an edge-to-edge sheet.
 */
export function ChatPanel() {
  const isClient = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const pathname = usePathname();
  const t = useTranslations("rituals.ai");
  const [open, setOpen] = useState(false);

  if (!isClient) return null;
  if (
    pathname === "/protected/settings" ||
    pathname.startsWith("/protected/settings/")
  ) {
    return null;
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <StriveAiFab onClick={() => setOpen(true)} />
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-40 bg-background/20 backdrop-blur-sm",
            "transition-opacity duration-200",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
          )}
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-3 top-20 z-50 flex flex-col overflow-hidden",
            "bottom-[calc(64px+env(safe-area-inset-bottom)+5.5rem)]",
            "rounded-2xl border border-border bg-card/90 backdrop-blur-xl",
            "shadow-[0_24px_50px_oklch(0_0_0/0.32),0_8px_20px_oklch(0_0_0/0.18)]",
            "transition-[opacity,transform] duration-200 ease-out",
            "data-starting-style:translate-y-2 data-starting-style:opacity-0",
            "data-ending-style:translate-y-2 data-ending-style:opacity-0",
          )}
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
            <DialogPrimitive.Title className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight text-foreground">
              <Sparkles aria-hidden className="size-4" strokeWidth={1.75} />
              {t("title")}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label={t("closeLabel")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X aria-hidden className="size-[18px]" strokeWidth={1.75} />
            </DialogPrimitive.Close>
          </header>
          <StriveChat />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
