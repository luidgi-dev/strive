import { getTranslations, setRequestLocale } from "next-intl/server";

import { DefineRitualButton } from "@/components/rituals/define-ritual-button";
import { RitualsEmptyState } from "@/components/rituals/rituals-empty-state";
import { RitualsList } from "@/components/rituals/rituals-list";
import {
  getRitualsForActiveUser,
  getVisibleCategoriesForUser,
} from "@/lib/data/rituals";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function RitualsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("rituals");
  const supabase = await createClient();
  const [{ rituals, progressByRitualId }, categories] = await Promise.all([
    getRitualsForActiveUser(supabase),
    getVisibleCategoriesForUser(supabase),
  ]);

  if (rituals.length === 0) {
    return <RitualsEmptyState categories={categories} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <h1 className="font-heading text-[22px] font-bold tracking-tight">
          {t("title")}
        </h1>
        <DefineRitualButton variant="pill" categories={categories} />
      </div>
      <RitualsList
        rituals={rituals}
        progressByRitualId={progressByRitualId}
        categories={categories}
      />
    </div>
  );
}
