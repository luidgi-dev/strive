import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations>;

/**
 * Translate `${prefix}.${code}`, falling back to `${prefix}.unknown` when the
 * code has no mapped message.
 *
 * next-intl throws on a missing message key, which crashes the whole rendering
 * component. Server-action and Zod error codes are not guaranteed to exist in
 * the message catalog (e.g. an unexpected DB error, or a raw Zod message used as
 * a key), so route every dynamic `errors.${code}` lookup through here to degrade
 * to a generic message instead of a hard crash.
 */
export function safeError(
  t: Translator,
  code: string | null | undefined,
  prefix = "errors",
): string {
  const key = `${prefix}.${code}`;
  if (t.has(key)) return t(key);
  const fallback = `${prefix}.unknown`;
  return t.has(fallback) ? t(fallback) : "";
}
