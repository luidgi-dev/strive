import { getTranslations } from "next-intl/server";

import type { CircleOverview } from "@/lib/data/circles";

import { CircleCard } from "./circle-card";

type Props = {
  circles: CircleOverview[];
  currentUserId: string | null;
};

export async function CirclesList({ circles, currentUserId }: Props) {
  const t = await getTranslations("circles");

  return (
    <section className="flex flex-col gap-2">
      <h2 className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {t("section.myCircles")}
      </h2>
      <div className="flex flex-col gap-2">
        {circles.map((circle) => (
          <CircleCard
            key={circle.id}
            circle={circle}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </section>
  );
}
