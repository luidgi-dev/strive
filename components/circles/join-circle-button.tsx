"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { joinByCode } from "@/app/[locale]/protected/(app)/circles/actions";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Variant = "pill" | "link";

type Props = {
  variant: Variant;
};

/**
 * Join a circle by entering an invite code, without leaving the app — the most
 * PWA-native path (no browser bounce). Opens a sheet, redeems the code, and
 * navigates to the circle on success.
 */
export function JoinCircleButton({ variant }: Props) {
  const t = useTranslations("circles.join");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await joinByCode(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setOpen(false);
        router.push(`/protected/circles/${result.data.circleId}`);
      }
    });
  };

  const canSubmit = code.trim().length > 0 && !isPending;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          variant === "pill" &&
            "inline-flex min-h-[44px] items-center rounded-full border border-border px-3.5 py-2 text-[11.5px] font-semibold tracking-wide text-foreground transition-colors hover:bg-accent",
          variant === "link" &&
            "text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground",
        )}
      >
        {t("cta")}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <header className="flex items-center justify-between gap-3 pb-1">
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetClose
              aria-label={t("close")}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
            </SheetClose>
          </header>
          <p className="text-sm text-muted-foreground">{t("body")}</p>
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("label")}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={12}
            className="h-11 font-mono tracking-wider"
          />
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {t(`errors.${error}`)}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={cn(
              "min-h-[44px] rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90",
              !canSubmit && "opacity-60",
            )}
          >
            {isPending ? t("joining") : t("cta")}
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}
