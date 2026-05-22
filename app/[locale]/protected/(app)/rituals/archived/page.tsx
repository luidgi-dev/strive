import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ArchivedRitualRow } from "@/components/rituals/archived-ritual-row";
import { getArchivedRitualsForActiveUser } from "@/lib/data/rituals";
import { Link } from "@/lib/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function ArchivedRitualsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("rituals");
  const supabase = await createClient();
  const archived = await getArchivedRitualsForActiveUser(supabase);

  return (
    <div className="flex flex-col gap-4">
      <header className="-mx-2 flex items-center gap-1">
        <Link
          href="/protected/rituals"
          aria-label={t("archived.back")}
          className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
        <h1 className="font-heading text-[18px] font-bold tracking-tight">
          {t("archived.title")}
        </h1>
      </header>

      {archived.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          {t("archived.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {archived.map((ritual) => (
            <ArchivedRitualRow key={ritual.id} ritual={ritual} />
          ))}
        </div>
      )}
    </div>
  );
}
