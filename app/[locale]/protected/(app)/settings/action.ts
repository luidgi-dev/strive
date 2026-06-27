"use server";

import { revalidatePath } from "next/cache";

import { DEMO_RESTRICTED, isDemoUser } from "@/lib/demo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;

const AVATAR_BUCKET = "user-assets";
// iPhone photos are routinely 3-5 MB. Keep in sync with CLIENT_AVATAR_MAX_BYTES
// in components/profile-section.tsx.
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  // HEIC/HEIF: iOS default since iOS 11. Safari usually converts on upload,
  // but accept the raw types as a fallback in case it does not.
  "image/heic": "heic",
  "image/heif": "heif",
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
  if (isDemoUser(user.id)) return { ok: false, error: DEMO_RESTRICTED };

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
  if (isDemoUser(user.id)) return { ok: false, error: DEMO_RESTRICTED };

  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `avatars/${user.id}/${filename}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[updateAvatar] storage upload failed", uploadError);
      return { ok: false, error: "uploadFailed" };
    }

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

    if (updateError) {
      console.error("[updateAvatar] profile update failed", updateError);
      return { ok: false, error: "uploadFailed" };
    }

    revalidatePath("/protected/settings");
    revalidatePath("/protected", "layout");
    return { ok: true };
  } catch (err) {
    console.error("[updateAvatar] unexpected error", err);
    return { ok: false, error: "uploadFailed" };
  }
}

export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // The shared demo account can never be deleted.
  if (isDemoUser(user.id)) return { ok: false, error: DEMO_RESTRICTED };

  const admin = createAdminClient();

  // Best-effort: storage objects aren't covered by the DB FK cascade, so remove
  // the user's avatar folder explicitly. A failure here must not block deletion.
  try {
    const { data: files } = await admin.storage
      .from(AVATAR_BUCKET)
      .list(`avatars/${user.id}`);
    if (files && files.length > 0) {
      await admin.storage
        .from(AVATAR_BUCKET)
        .remove(files.map((file) => `avatars/${user.id}/${file.name}`));
    }
  } catch (err) {
    console.error("[deleteAccount] avatar cleanup failed", err);
  }

  // Deleting the auth user cascades through profiles (FK on delete cascade) to
  // rituals, ritual_logs, circle memberships, etc.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[deleteAccount] deleteUser failed", error);
    return { ok: false, error: "unknown" };
  }

  return { ok: true };
}
