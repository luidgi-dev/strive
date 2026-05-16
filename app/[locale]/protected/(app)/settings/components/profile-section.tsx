"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil, Loader2, Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { updateAvatar, updateUsername } from "../action";

type Props = {
  username: string;
  email: string;
  avatarUrl: string | null;
};

const KNOWN_PROFILE_ERRORS = new Set([
  "usernameInvalid",
  "usernameTaken",
  "avatarTooLarge",
  "avatarWrongType",
  "uploadFailed",
]);

// Keep in sync with AVATAR_MAX_BYTES in ../action.ts. The client check fails fast
// (no wasted upload of a too-large iPhone photo) before the server action runs.
const CLIENT_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function ProfileSection({ username, email, avatarUrl }: Props) {
  const t = useTranslations("settings.profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(username);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [usernamePending, startUsernameTransition] = useTransition();
  const [avatarPending, startAvatarTransition] = useTransition();

  const initial = (username || email || "S").trim().charAt(0).toUpperCase();

  function openFilePicker() {
    setAvatarError(null);
    fileInputRef.current?.click();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > CLIENT_AVATAR_MAX_BYTES) {
      setAvatarError("avatarTooLarge");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.set("avatar", file);

    startAvatarTransition(async () => {
      const result = await updateAvatar(formData);
      if (!result.ok) {
        setAvatarError(
          KNOWN_PROFILE_ERRORS.has(result.error) ? result.error : "uploadFailed",
        );
      }
    });

    e.target.value = "";
  }

  function startEdit() {
    setUsernameError(null);
    setDraft(username);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(username);
    setUsernameError(null);
  }

  function commit() {
    const next = draft.trim();
    if (next === username) {
      setEditing(false);
      return;
    }
    startUsernameTransition(async () => {
      const result = await updateUsername(next);
      if (!result.ok) {
        setUsernameError(
          KNOWN_PROFILE_ERRORS.has(result.error) ? result.error : "usernameInvalid",
        );
        return;
      }
      setUsernameError(null);
      setEditing(false);
    });
  }

  return (
    <section className="flex flex-col items-center gap-4 py-6">
      <div className="relative">
        <Avatar className="size-28">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={username} /> : null}
          <AvatarFallback className="bg-muted font-heading text-4xl font-semibold text-muted-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>

        <button
          type="button"
          onClick={openFilePicker}
          disabled={avatarPending}
          aria-label={t("editAvatar")}
          className={cn(
            "absolute bottom-0 right-0 inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors",
            "hover:bg-muted hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {avatarPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Pencil className="size-4" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {avatarError ? (
        <p className="text-xs text-destructive">{t(avatarError)}</p>
      ) : null}

      <div className="flex w-full flex-col items-center gap-1">
        {editing ? (
          <div className="flex w-full max-w-xs items-center gap-2">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (usernameError) setUsernameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") cancelEdit();
              }}
              aria-invalid={usernameError ? true : undefined}
              disabled={usernamePending}
              className="text-center"
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={commit}
              disabled={usernamePending}
              aria-label={t("save")}
            >
              {usernamePending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={cancelEdit}
              disabled={usernamePending}
              aria-label={t("cancel")}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex min-h-[44px] items-center justify-center">
            <div className="relative">
              <span className="font-heading text-xl font-semibold tracking-tight">
                {username}
              </span>
              <button
                type="button"
                onClick={startEdit}
                aria-label={t("editUsername")}
                className="absolute left-full top-1/2 ml-1 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-muted-foreground"
              >
                <Pencil className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {usernameError ? (
          <p className="text-xs text-destructive">{t(usernameError)}</p>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">{email}</p>
    </section>
  );
}
