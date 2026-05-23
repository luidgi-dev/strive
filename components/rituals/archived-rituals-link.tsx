import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/lib/i18n/navigation";

type Props = { count: number };

/** Muted "N archived rituals" link at the bottom of the Rituals tab. Hidden when N = 0. */
export async function ArchivedRitualsLink({ count }: Props) {
  if (count <= 0) return null;
  const t = await getTranslations("rituals");

  return (
    <Link
      href="/protected/rituals/archived"
      className="flex min-h-[44px] items-center justify-between rounded-xl border border-dashed border-muted-foreground/30 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <span>{t("archived.link", { count })}</span>
      <ChevronRight aria-hidden className="size-3.5" />
    </Link>
  );
}
