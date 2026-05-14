"use client";

import { Moon, MonitorSmartphone, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Locale = "en" | "fr";
type ThemeMode = "light" | "dark" | "system";

const KNOWN_THEMES: ReadonlySet<ThemeMode> = new Set(["light", "dark", "system"]);

export function PreferencesSection() {
  const t = useTranslations("settings");
  const tPref = useTranslations("settings.preferences");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const { theme, setTheme } = useTheme();
  const activeTheme: ThemeMode = KNOWN_THEMES.has(theme as ThemeMode)
    ? (theme as ThemeMode)
    : "system";

  function switchLocale(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
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
            aria-label="English"
          >
            EN
          </SegmentedButton>
          <SegmentedButton
            active={locale === "fr"}
            onClick={() => switchLocale("fr")}
            aria-label="Français"
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

      <div className="flex min-h-[44px] items-center justify-between gap-3 opacity-60">
        <div className="flex flex-col">
          <span className="text-sm">{tPref("smartReminders")}</span>
          <span className="text-xs text-muted-foreground">{tPref("comingSoon")}</span>
        </div>
        <FakeSwitch />
      </div>
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

function FakeSwitch() {
  return (
    <div
      aria-disabled
      className="pointer-events-none relative h-5 w-9 rounded-full bg-muted-foreground/30"
    >
      <div className="absolute left-0.5 top-0.5 size-4 rounded-full bg-background" />
    </div>
  );
}
