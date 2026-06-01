"use client";

import { useTranslations } from "next-intl";

/**
 * Opening Strive bubble shown above the conversation. A single, stable, on-brand
 * intro (not the user's words), purely client-side and never added to the
 * message history, so it costs no credit and the model never sees it.
 */
export function Greeting() {
  const t = useTranslations("rituals.ai");

  return (
    <div className="max-w-[84%] self-start rounded-[18px_18px_18px_4px] bg-accent px-3 py-2 text-sm leading-snug text-foreground">
      {t("greeting")}
    </div>
  );
}
