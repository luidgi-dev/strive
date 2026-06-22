"use server";

import { redirect } from "next/navigation";

import { defaultLocale } from "@/i18n";
import { createClient } from "@/lib/supabase/server";

/**
 * Redeem an invite and join its circle. Backed by the security-definer
 * redeem_circle_invite (a joining member can't self-insert under RLS). Always
 * redirects: to the circle on success / already-member, back to the landing
 * otherwise (it re-renders the right state). Works without JS as a form action.
 */
export async function joinCircle(formData: FormData): Promise<void> {
  const code = formData.get("code");
  const localeValue = formData.get("locale");
  const locale = typeof localeValue === "string" ? localeValue : defaultLocale;
  const prefix = locale === defaultLocale ? "" : `/${locale}`;

  if (typeof code !== "string" || code.length === 0) {
    redirect(`${prefix}/protected/circles`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_circle_invite", {
    p_code: code,
  });
  const result = data?.[0];

  if (error || !result) {
    console.error("[joinCircle] redeem failed", error);
    redirect(`${prefix}/i/${code}`);
  }

  if (
    (result.status === "joined" || result.status === "already_member") &&
    result.circle_id
  ) {
    redirect(`${prefix}/protected/circles/${result.circle_id}`);
  }

  // expired / full / invalid / unauthenticated -> re-render the landing.
  redirect(`${prefix}/i/${code}`);
}
