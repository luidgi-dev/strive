import { getTranslations, setRequestLocale } from "next-intl/server";

import { CirclesEmptyState } from "@/components/circles/circles-empty-state";
import { CirclesList } from "@/components/circles/circles-list";
import { JoinCircleButton } from "@/components/circles/join-circle-button";
import { NewCircleButton } from "@/components/circles/new-circle-button";
import { getCirclesOverview } from "@/lib/data/circles";
import { isDemoUser } from "@/lib/demo";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function CirclesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("circles");
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    circles,
  ] = await Promise.all([supabase.auth.getUser(), getCirclesOverview(supabase)]);

  const isDemo = isDemoUser(user?.id);

  if (circles.length === 0) {
    return <CirclesEmptyState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <h1 className="font-heading text-[22px] font-bold tracking-tight">
          {t("title")}
        </h1>
        <div className="flex items-center gap-2">
          <JoinCircleButton variant="pill" />
          <NewCircleButton variant="pill" disabled={isDemo} />
        </div>
      </div>
      <CirclesList circles={circles} currentUserId={user?.id ?? null} />
    </div>
  );
}
