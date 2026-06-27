"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { deleteAccount } from "@/app/[locale]/protected/(app)/settings/action";
import { LogoutButton } from "@/components/forms/logout-button";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export function DangerZoneSection({ isDemo = false }: { isDemo?: boolean }) {
  const t = useTranslations("settings.danger");
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setFailed(false);
    startTransition(async () => {
      const res = await deleteAccount();
      if (!res.ok) {
        setFailed(true);
        return;
      }
      // The account is gone; keep the controls disabled (the transition ends as
      // soon as this callback returns, before navigation completes) and clear
      // this device's session before returning to the landing page.
      setDone(true);
      await createClient().auth.signOut();
      router.push("/");
      router.refresh();
    });
  }

  const busy = isPending || done;

  return (
    <section className="flex flex-col gap-3">
      <LogoutButton variant="secondary" size="lg" className="h-11 w-full">
        {t("logOut")}
      </LogoutButton>

      {/* Account deletion is hidden entirely in demo mode. */}
      {isDemo ? null : confirming ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              {t("deleteConfirmTitle")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("deleteConfirmBody")}
            </p>
          </div>
          {failed ? (
            <p className="text-xs text-destructive">{t("deleteError")}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 flex-1"
              disabled={busy}
              onClick={() => {
                setFailed(false);
                setConfirming(false);
              }}
            >
              {t("deleteCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 flex-1"
              disabled={busy}
              onClick={handleDelete}
            >
              {t("deleteConfirm")}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="self-center px-3 py-2 text-sm text-destructive/70 transition-colors hover:text-destructive"
        >
          {t("deleteAccount")}
        </button>
      )}
    </section>
  );
}
