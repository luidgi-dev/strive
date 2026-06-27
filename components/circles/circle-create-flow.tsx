"use client";

import { Check, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { safeError } from "@/lib/i18n/safe-error";
import { useState, useTransition } from "react";

import { createCircle } from "@/app/[locale]/protected/(app)/circles/actions";
import { Input } from "@/components/ui/input";
import { SheetClose, SheetTitle } from "@/components/ui/sheet";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

import { InviteLinkShare } from "./invite-link-share";

type Props = {
  onClose: () => void;
};

/**
 * The two-step create-circle flow inside a bottom sheet: a minimal form (name +
 * optional note), then a confirmation showing the shareable invite link. The
 * confirmation replaces the form in place once creation succeeds.
 */
export function CircleCreateFlow({ onClose }: Props) {
  const t = useTranslations("circles.create");
  const router = useRouter();
  const [name, setName] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [created, setCreated] = useState<{
    circleId: string;
    code: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCircle({ name, description: note });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated(result.data ?? null);
    });
  };

  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-momentum/15 text-momentum">
          <Check aria-hidden className="size-6" strokeWidth={2.5} />
        </span>
        <div className="flex flex-col gap-1 text-center">
          <SheetTitle>{t("success.title", { name: name.trim() })}</SheetTitle>
          <p className="text-sm text-muted-foreground">{t("success.body")}</p>
        </div>
        <InviteLinkShare code={created.code} />
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push(`/protected/circles/${created.circleId}`);
          }}
          className="min-h-[44px] rounded-full text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("success.doneLater")}
        </button>
      </div>
    );
  }

  const canSubmit = name.trim().length > 0 && !isPending;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3 pb-1">
        <SheetTitle>{t("title")}</SheetTitle>
        <SheetClose
          aria-label={t("cancel")}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X aria-hidden className="size-4" />
        </SheetClose>
      </header>

      <div className="flex flex-col gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("namePlaceholder")}
          aria-label={t("nameLabel")}
          maxLength={60}
          autoFocus
          className="h-11"
        />
        {noteOpen ? (
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("notePlaceholder")}
            aria-label={t("noteLabel")}
            rows={3}
            maxLength={280}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring"
          />
        ) : (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="inline-flex w-fit items-center gap-1.5 px-1 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus aria-hidden className="size-3.5" strokeWidth={2.5} />
            {t("addNote")}
          </button>
        )}
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {safeError(t, error)}
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
        {isPending ? t("creating") : t("cta")}
      </button>
    </div>
  );
}
