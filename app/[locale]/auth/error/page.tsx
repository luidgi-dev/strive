import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ErrorPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function Page({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("errorTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {params?.error ? (
                <p className="text-sm text-muted-foreground">
                  {t("errorCode", { error: params.error })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("errorFallback")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
