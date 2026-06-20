import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { NewCircleButton } from "./new-circle-button";

export async function CirclesEmptyState() {
  const t = await getTranslations("circles");

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-2 pb-24 text-center">
      <div
        aria-hidden
        className="flex size-16 items-center justify-center rounded-2xl bg-accent text-muted-foreground"
      >
        <Users className="size-8" strokeWidth={1.5} />
      </div>
      <h2 className="max-w-[280px] font-heading text-[22px] font-bold leading-tight tracking-tight text-foreground">
        {t("empty.title")}
      </h2>
      <p className="max-w-[280px] text-[13.5px] leading-relaxed text-muted-foreground">
        {t("empty.body")}
      </p>
      <NewCircleButton variant="cta" />
    </div>
  );
}
