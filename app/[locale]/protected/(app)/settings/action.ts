"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;

const AVATAR_BUCKET = "user-assets";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateUsername(rawUsername: string): Promise<ActionResult> {
  const username = rawUsername.trim();

  if (
    username.length < USERNAME_MIN ||
    username.length > USERNAME_MAX ||
    !USERNAME_REGEX.test(username)
  ) {
    return { ok: false, error: "usernameInvalid" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "usernameTaken" };
    return { ok: false, error: "uploadFailed" };
  }

  revalidatePath("/protected/settings");
  revalidatePath("/protected", "layout");
  return { ok: true };
}

export async function updateAvatar(formData: FormData): Promise<ActionResult> {
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "uploadFailed" };
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: "avatarTooLarge" };
  }

  const ext = AVATAR_MIME_TO_EXT[file.type];
  if (!ext) {
    return { ok: false, error: "avatarWrongType" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "unauthorized" };

  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `avatars/${user.id}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { ok: false, error: "uploadFailed" };

  const { data: publicUrlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrlData.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) return { ok: false, error: "uploadFailed" };

  revalidatePath("/protected/settings");
  revalidatePath("/protected", "layout");
  return { ok: true };
}
