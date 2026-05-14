"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { LogoutButton } from "@/components/forms/logout-button";
import { Button } from "@/components/ui/button";

export function DangerZoneSection() {
  const t = useTranslations("settings.danger");
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <LogoutButton variant="secondary" size="lg" className="h-11 w-full">
        {t("logOut")}
      </LogoutButton>

      {confirming ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              {t("deleteConfirmTitle")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("deleteConfirmBody")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 flex-1"
              onClick={() => setConfirming(false)}
            >
              {t("deleteCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 flex-1"
              onClick={() => {
                // TODO: wire delete-account server action
                // - cascade-delete via FK from profiles.id
                // - supabase.auth.admin.deleteUser(user.id) using a service-role client
                // - sign out + redirect to /
                setConfirming(false);
              }}
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
