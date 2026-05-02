import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { defaultLocale } from "@/i18n";

type RouteProps = {
  params: Promise<{ locale: string }>;
};

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { locale } = await params;
  const url = new URL(request.url);
  const { searchParams } = url;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const withLocale = (path: string) =>
    locale === defaultLocale ? path : `/${locale}${path}`;

  const _next = searchParams.get("next");
  const next =
    _next?.startsWith("/")
      ? _next
      : withLocale("/auth/confirmed");

  if (error || errorDescription) {
    const errorMessage = errorDescription ?? error ?? "Invalid or expired confirmation link";
    return NextResponse.redirect(
      new URL(`${withLocale("/auth/error")}?error=${encodeURIComponent(errorMessage)}`, url.origin)
    );
  }

  if (token_hash && type) {
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!verifyError) {
      return NextResponse.redirect(new URL(next, url.origin));
    }

    console.error("Auth verification error:", verifyError.message);
    return NextResponse.redirect(
      new URL(
        `${withLocale("/auth/error")}?error=${encodeURIComponent(verifyError.message)}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(
    new URL(
      `${withLocale("/auth/error")}?error=${encodeURIComponent("Invalid token or missing type")}`,
      url.origin
    )
  );
}
