import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ locale: string }> };

export default async function FlowPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tNav = await getTranslations("navigation");
  const tApp = await getTranslations("app.flow");
  const tLanding = await getTranslations("landing.hero");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <h1 className="text-4xl font-bold tracking-tighter">
        {tNav("flow")}
      </h1>

      <p className="text-muted-foreground max-w-[250px]">
        {tApp("description")}
      </p>

      <Button disabled size="lg" variant="outline" className="mt-4 min-h-[44px] min-w-[44px] px-6 border-dashed opacity-50">
        {tLanding("cta")}
      </Button>
    </div>
  );
}
