import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { defaultLocale } from "@/i18n";
import { getCircleInvitePreview } from "@/lib/data/invites";
import { Link } from "@/lib/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

import { joinCircle } from "./actions";

type Props = {
  params: Promise<{ locale: string; code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const supabase = await createClient();
  const preview = await getCircleInvitePreview(supabase, code);
  const t = await getTranslations("invite");

  if (!preview) {
    return { title: t("invalidTitle") };
  }

  const title = t("meta.title", { circle: preview.circleName });
  const description = t("meta.description", { circle: preview.circleName });
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: ["/web-app-manifest-512x512.png"],
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function InvitePage({ params }: Props) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("invite");
  const tCommon = await getTranslations("common");
  const supabase = await createClient();

  const [
    preview,
    {
      data: { user },
    },
  ] = await Promise.all([
    getCircleInvitePreview(supabase, code),
    supabase.auth.getUser(),
  ]);

  const prefix = locale === defaultLocale ? "" : `/${locale}`;

  // Already a member (the creator included) -> straight to the circle.
  if (preview && user) {
    const { data: isMember } = await supabase.rpc("is_circle_member", {
      p_circle_id: preview.circleId,
    });
    if (isMember) {
      redirect(`${prefix}/protected/circles/${preview.circleId}`);
    }
  }

  const blocked = !preview || preview.isExpired || preview.isFull;
  const invitePath = `${prefix}/i/${code}`;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-7 text-center">
        <Link
          href="/"
          aria-label={tCommon("appName")}
          className="flex flex-col items-center gap-2"
        >
          <span className="overflow-hidden rounded-2xl">
            <Image
              src="/strive-app-dark.svg"
              alt=""
              width={56}
              height={56}
              className="hidden dark:block"
            />
            <Image
              src="/strive-app-light.svg"
              alt=""
              width={56}
              height={56}
              className="block dark:hidden"
            />
          </span>
          <span className="text-lg font-bold tracking-tighter text-foreground">
            {tCommon("appName")}
          </span>
        </Link>

        {blocked ? (
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-heading text-[22px] font-bold tracking-tight text-foreground">
              {t("invalidTitle")}
            </h1>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {preview?.isFull && !preview.isExpired
                ? t("fullBody")
                : t("invalidBody")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {t("kicker")}
              </span>
              <h1 className="font-heading text-[26px] font-bold leading-tight tracking-tight text-foreground">
                {user
                  ? t("joinTitle", { circle: preview.circleName })
                  : t("guestTitle", { circle: preview.circleName })}
              </h1>
              {preview.description ? (
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  {preview.description}
                </p>
              ) : null}
              <p className="text-[13px] text-muted-foreground">
                {t("byline", {
                  creator: preview.creatorUsername ?? t("someone"),
                  count: preview.memberCount,
                })}
              </p>
            </div>

            {user ? (
              <form action={joinCircle} className="w-full">
                <input type="hidden" name="code" value={code} />
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  {t("joinCta", { circle: preview.circleName })}
                </button>
              </form>
            ) : (
              <div className="flex w-full flex-col gap-3">
                <Link
                  href={`/auth/sign-up?next=${encodeURIComponent(invitePath)}`}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  {t("guestCta")}
                </Link>
                <Link
                  href={`/auth/login?next=${encodeURIComponent(invitePath)}`}
                  className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("loginCta")}
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
