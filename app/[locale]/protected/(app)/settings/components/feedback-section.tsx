"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ImagePlus, Loader2, MessageSquare, X } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import {
  FEEDBACK_BODY_MAX,
  FEEDBACK_SCREENSHOT_MAX_BYTES,
  FEEDBACK_SCREENSHOT_MIME_TO_EXT,
  FEEDBACK_TAGS,
  FEEDBACK_TITLE_MAX,
  type FeedbackTag,
} from "@/lib/feedback/types";
import { cn } from "@/lib/utils";

import { submitFeedback } from "../feedback-action";

// Keep the picker filter in lockstep with the server-side accepted types.
const ACCEPTED_IMAGE_TYPES = Object.keys(FEEDBACK_SCREENSHOT_MIME_TO_EXT).join(
  ",",
);

// Server error code → i18n key. Anything unexpected falls back to errorFailed.
const ERROR_TO_KEY: Record<string, string> = {
  invalid: "errorInvalid",
  unauthorized: "errorFailed",
  demo_restricted: "errorFailed",
  screenshotTooLarge: "errorScreenshotTooLarge",
  screenshotWrongType: "errorScreenshotWrongType",
  failed: "errorFailed",
};

const SUCCESS_TOAST_MS = 5000;

export function FeedbackSection({ isDemo = false }: { isDemo?: boolean }) {
  const t = useTranslations("settings.feedback");
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // The shared demo account can't submit feedback (server rejects it too); hide
  // the entry point entirely rather than show a dead control.
  if (isDemo) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {t("label")}
      </h2>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted"
      >
        <MessageSquare className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{t("send")}</span>
      </button>

      <FeedbackSheet
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          setOpen(false);
          setShowSuccess(true);
        }}
      />

      {showSuccess ? (
        <FeedbackSuccessToast
          message={t("success")}
          dismissLabel={t("close")}
          onDone={() => setShowSuccess(false)}
        />
      ) : null}
    </section>
  );
}

function FeedbackSuccessToast({
  message,
  dismissLabel,
  onDone,
}: {
  message: string;
  dismissLabel: string;
  onDone: () => void;
}) {
  // Keep the latest onDone without resetting the auto-dismiss timer on re-render.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const timer = setTimeout(() => onDoneRef.current(), SUCCESS_TOAST_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Toast
      icon={<Check className="size-[18px]" />}
      onDismiss={() => onDoneRef.current()}
      dismissLabel={dismissLabel}
    >
      {message}
    </Toast>
  );
}

function FeedbackSheet({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("settings.feedback");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tag, setTag] = useState<FeedbackTag>("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTag("bug");
    setTitle("");
    setBody("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    // Start fresh next time the sheet opens.
    if (!next) reset();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    if (next && next.size > FEEDBACK_SCREENSHOT_MAX_BYTES) {
      setError("screenshotTooLarge");
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (trimmedTitle.length === 0 || trimmedBody.length === 0) {
      setError("invalid");
      return;
    }

    const formData = new FormData();
    formData.set("tag", tag);
    formData.set("title", trimmedTitle);
    formData.set("body", trimmedBody);
    if (file) formData.set("screenshot", file);

    setError(null);
    startTransition(async () => {
      const res = await submitFeedback(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      reset();
      onSuccess();
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <header className="flex items-start justify-between gap-3 pb-1">
          <div className="flex flex-col gap-1">
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("description")}</SheetDescription>
          </div>
          <SheetClose
            aria-label={t("close")}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </SheetClose>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            {FEEDBACK_TAGS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTag(option)}
                aria-pressed={tag === option}
                className={cn(
                  "flex-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                  tag === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {t(`tag_${option}`)}
              </button>
            ))}
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={FEEDBACK_TITLE_MAX}
            required
            placeholder={t("titlePlaceholder")}
            aria-label={t("titlePlaceholder")}
          />

          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={FEEDBACK_BODY_MAX}
            required
            placeholder={t("bodyPlaceholder")}
            aria-label={t("bodyPlaceholder")}
          />

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 w-full justify-start gap-2 font-normal text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {file ? file.name : t("screenshot")}
            </Button>
            {file ? (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="self-start text-xs text-muted-foreground hover:text-foreground"
              >
                {t("screenshotRemove")}
              </button>
            ) : null}
          </div>

          {error ? (
            <p className="text-xs text-destructive">
              {t(ERROR_TO_KEY[error] ?? "errorFailed")}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full"
            disabled={
              isPending ||
              title.trim().length === 0 ||
              body.trim().length === 0
            }
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t("submit")
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
