"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { safeError } from "@/lib/i18n/safe-error";
import { useState, useTransition } from "react";

import { generateInviteLink } from "@/app/[locale]/protected/(app)/circles/[id]/actions";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { InviteLinkShare } from "./invite-link-share";

type Props = {
  circleId: string;
  isOwner: boolean;
  /** The circle's active invite code, if one exists (members can copy it). */
  activeCode: string | null;
};

/**
 * The hero "Invite" action. Opens a sheet with the shareable link: an existing
 * active link if there is one, otherwise the owner can mint a fresh one (used
 * after the 7-day expiry). Members without an active link are pointed to the
 * owner, since only the owner can create invites.
 */
export function CircleInviteButton({ circleId, isOwner, activeCode }: Props) {
  const t = useTranslations("circles.detail");
  const tInvite = useTranslations("circles.invite");
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(activeCode);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generateInviteLink(circleId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCode(result.data?.code ?? null);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/30 px-3 py-1.5 text-[11.5px] font-medium tracking-wide text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Plus aria-hidden className="size-3" strokeWidth={2.5} />
        {t("invite")}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <header className="flex items-center justify-between gap-3 pb-1">
            <SheetTitle>{tInvite("sheetTitle")}</SheetTitle>
            <SheetClose
              aria-label={tInvite("close")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </SheetClose>
          </header>
          <p className="text-sm text-muted-foreground">{tInvite("sheetBody")}</p>

          {code ? (
            <InviteLinkShare code={code} />
          ) : isOwner ? (
            <>
              {error ? (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {safeError(t, error)}
                </p>
              ) : null}
              <button
                type="button"
                onClick={onGenerate}
                disabled={isPending}
                className={cn(
                  "min-h-[44px] rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90",
                  isPending && "opacity-60",
                )}
              >
                {isPending ? tInvite("generating") : tInvite("generate")}
              </button>
            </>
          ) : (
            <p className="rounded-xl border border-border bg-card px-4 py-6 text-center text-[13px] text-muted-foreground">
              {tInvite("noLink")}
            </p>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
