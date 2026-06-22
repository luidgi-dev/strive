"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  code: string;
};

/**
 * Read-only invite URL with Copy and native Share actions. Reused by the create
 * confirmation and the circle-detail Invite button. Builds the URL from the
 * current origin, so it is correct in every environment (dev, preview, prod).
 */
export function InviteLinkShare({ code }: Props) {
  const t = useTranslations("circles.invite");
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/i/${code}`
      : `/i/${code}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the read-only field still lets the user copy manually.
    }
  };

  const onCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Clipboard blocked: the code stays visible to copy manually.
    }
  };

  const onShare = async () => {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      void onCopy();
      return;
    }
    try {
      await navigator.share({ url, title: t("shareTitle") });
    } catch {
      // The user dismissed the native share sheet; nothing to do.
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-accent/50 px-3 py-2">
        <input
          readOnly
          value={url}
          aria-label={t("linkLabel")}
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 truncate bg-transparent text-[13px] text-foreground outline-none"
        />
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-foreground/5"
        >
          {copied ? (
            <Check aria-hidden className="size-3.5 text-momentum" />
          ) : (
            <Copy aria-hidden className="size-3.5" />
          )}
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
      <button
        type="button"
        onClick={onShare}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        <Share2 aria-hidden className="size-4" />
        {t("share")}
      </button>

      <div className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
        <span>{t("orCode")}</span>
        <span className="font-mono font-semibold tracking-wider text-foreground">
          {code}
        </span>
        <button
          type="button"
          onClick={onCopyCode}
          aria-label={t("copyCode")}
          className="inline-flex size-7 items-center justify-center rounded-full transition-colors hover:bg-foreground/5"
        >
          {copiedCode ? (
            <Check aria-hidden className="size-3.5 text-momentum" />
          ) : (
            <Copy aria-hidden className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
