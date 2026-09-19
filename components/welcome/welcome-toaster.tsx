"use client";

import { Compass, Hand } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { markWelcomed } from "@/app/[locale]/protected/actions";
import { useToast } from "@/components/ui/toast-provider";

/** Query flag set by signInAsDemo, the only entry point into the demo account. */
const WELCOME_PARAM = "welcome";
const DEMO_VALUE = "demo";

type Props = {
  /** Name to greet a real first-time user by. */
  username: string | null;
  /** True when this account has never been welcomed (see markWelcomed). */
  showFirstLogin: boolean;
};

/**
 * The one-time welcome moment, shown over whichever protected screen the user
 * lands on. It renders nothing itself: it pushes a toast through the shared
 * ToastProvider, so it inherits the card, the auto-dismiss and the one-at-a-time
 * queue used by the other confirmation toasts.
 *
 * Two triggers, because the two accounts differ. A real account is greeted once
 * ever, tracked server-side. The demo account is shared by every visitor, so no
 * per-user flag would work there and its welcome rides on the entry URL instead.
 */
export function WelcomeToaster({ username, showFirstLogin }: Props) {
  const t = useTranslations("welcome");
  const toast = useToast();
  const searchParams = useSearchParams();
  // The welcome fires once per mount at most; the ref survives the double-invoke
  // React does in development.
  const fired = useRef(false);

  const isDemoEntry = searchParams.get(WELCOME_PARAM) === DEMO_VALUE;

  useEffect(() => {
    if (fired.current) return;

    if (isDemoEntry) {
      fired.current = true;
      toast.show({
        icon: <Compass className="size-[18px]" />,
        message: t("demo"),
      });
      // Drop the flag from the address without a server round-trip, so a reload
      // (or an iOS standalone relaunch restoring the last URL) stays silent.
      // Only our own param goes: anything else on the URL is left untouched.
      const params = new URLSearchParams(window.location.search);
      params.delete(WELCOME_PARAM);
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
      );
      return;
    }

    if (showFirstLogin) {
      fired.current = true;
      toast.show({
        icon: <Hand className="size-[18px]" />,
        message: t("firstLogin", { username: username ?? "" }),
      });
      void markWelcomed();
    }
  }, [isDemoEntry, showFirstLogin, t, toast, username]);

  return null;
}
