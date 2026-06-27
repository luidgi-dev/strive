"use client";

import { Moon, MonitorSmartphone, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { defaultLocale, locales } from "@/lib/locales";
import { usePathname } from "@/lib/i18n/navigation";
import { setSmartRemindersEnabled } from "@/lib/push/actions";
import {
  disablePush,
  enablePush,
  getPushState,
  type PushState,
} from "@/lib/push/client";
import { cn } from "@/lib/utils";

type Locale = "en" | "fr";
type ThemeMode = "light" | "dark" | "system";

const KNOWN_THEMES: ReadonlySet<ThemeMode> = new Set(["light", "dark", "system"]);

export function PreferencesSection({
  isDemo = false,
}: {
  isDemo?: boolean;
}) {
  const t = useTranslations("settings");
  const tPref = useTranslations("settings.preferences");
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  const { theme, setTheme } = useTheme();
  const activeTheme: ThemeMode = KNOWN_THEMES.has(theme as ThemeMode)
    ? (theme as ThemeMode)
    : "system";

  function switchLocale(next: Locale) {
    if (next === locale) return;
    // Hard navigation. A soft navigation via the next-intl router updates the
    // URL but Next.js can serve the cached [locale]/layout.tsx (with the
    // previous locale's NextIntlClientProvider messages), leaving the page in
    // the old language. A full reload re-renders the layout server-side with
    // the new locale.
    //
    // Use `replace` (not `assign`) so the previous-locale page is not left in
    // the browser history. Otherwise a swipe-back gesture lands on the same
    // page in the old language, which feels broken.
    const cleanPath =
      pathname.replace(new RegExp(`^/(?:${locales.join("|")})(?=/|$)`), "") ||
      "/";
    const target = next === defaultLocale ? cleanPath : `/${next}${cleanPath}`;
    window.location.replace(target);
  }

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: tPref("themeLight"), icon: Sun },
    { value: "dark", label: tPref("themeDark"), icon: Moon },
    { value: "system", label: tPref("themeSystem"), icon: MonitorSmartphone },
  ];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {tPref("label")}
      </h2>

      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <span className="text-sm">{t("language")}</span>
        <Segmented>
          <SegmentedButton
            active={locale === "en"}
            onClick={() => switchLocale("en")}
            aria-label={tPref("languageEnglish")}
          >
            EN
          </SegmentedButton>
          <SegmentedButton
            active={locale === "fr"}
            onClick={() => switchLocale("fr")}
            aria-label={tPref("languageFrench")}
          >
            FR
          </SegmentedButton>
        </Segmented>
      </div>

      <Divider />

      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <span className="text-sm">{t("theme")}</span>
        <Segmented>
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = activeTheme === opt.value;
            return (
              <SegmentedButton
                key={opt.value}
                active={active}
                onClick={() => setTheme(opt.value)}
                aria-label={opt.label}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{opt.label}</span>
              </SegmentedButton>
            );
          })}
        </Segmented>
      </div>

      <Divider />

      <RemindersControl isDemo={isDemo} />
    </section>
  );
}

function Segmented({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md bg-muted p-1">
      {children}
    </div>
  );
}

function SegmentedButton({
  active,
  onClick,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      // The theme variant of this control reads from localStorage via
      // next-themes, so the active state can differ between SSR and the
      // first client render. React patches the correct value after
      // hydration; suppressing here keeps the console clean.
      suppressHydrationWarning
      {...rest}
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-border" aria-hidden />;
}

// Web Push opt-in. The toggle drives both the per-device subscription (lib/push)
// and the account-level intent (profiles.smart_reminders_enabled, the cron's
// kill-switch). Displayed state reflects this device's subscription.
function RemindersControl({
  isDemo = false,
}: {
  isDemo?: boolean;
}) {
  const tPref = useTranslations("settings.preferences");
  const locale = useLocale() as Locale;
  const [state, setState] = useState<PushState | "loading">("loading");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPushState()
      .then(setState)
      .catch(() => setState("unsupported"));
  }, []);

  const isOn = state === "on";
  // Can't toggle while loading, when the platform lacks support (e.g. iOS not
  // installed as a PWA), or when the user has hard-blocked notifications.
  const disabled =
    isDemo ||
    busy ||
    state === "loading" ||
    state === "unsupported" ||
    state === "denied";

  async function toggle() {
    if (disabled) return;
    setBusy(true);
    setFailed(false);
    try {
      if (isOn) {
        // Flip the account intent off first, then drop this device's subscription.
        const intent = await setSmartRemindersEnabled(false);
        if (!intent.ok) throw new Error(intent.error);
        setState(await disablePush());
      } else {
        // Subscribe this device first (may fail on permission), then persist
        // the account intent only once a subscription actually exists.
        const next = await enablePush(locale);
        setState(next);
        if (next === "on") {
          const intent = await setSmartRemindersEnabled(true);
          if (!intent.ok) throw new Error(intent.error);
        }
      }
    } catch (err) {
      // Surface failures (e.g. missing VAPID env, network) instead of silently
      // reverting — otherwise the toggle just looks dead.
      console.error("[reminders] toggle failed", err);
      setFailed(true);
      setState(await getPushState());
    } finally {
      setBusy(false);
    }
  }

  const hint = failed
    ? tPref("smartRemindersError")
    : state === "unsupported"
      ? tPref("smartRemindersUnsupported")
      : state === "denied"
        ? tPref("smartRemindersDenied")
        : "";

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "flex min-h-[44px] items-center justify-between gap-3",
          state === "unsupported" && "opacity-60",
        )}
      >
        <div className="flex flex-col">
          <span className="text-sm">{tPref("smartReminders")}</span>
          {hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
        <Switch
          checked={isOn}
          disabled={disabled}
          onClick={toggle}
          aria-label={tPref("smartReminders")}
        />
      </div>

    </div>
  );
}

function Switch({
  checked,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { checked: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      // Subscription state is read client-side after mount, so the rendered
      // value can differ from SSR until the effect resolves.
      suppressHydrationWarning
      {...rest}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        checked
          ? "border-primary bg-primary"
          : "border-border bg-muted-foreground/25",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 size-4 -translate-y-1/2 rounded-full shadow-sm transition-all",
          checked ? "left-6 bg-primary-foreground" : "left-1 bg-foreground/70",
        )}
      />
    </button>
  );
}
