// components/ui/bottom-nav.tsx
"use client";

import { HeartHandshake, Users, AudioWaveform } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  if (pathname === "/protected/settings" || pathname.startsWith("/protected/settings/")) {
    return null;
  }

  const navItems = [
    { name: t("flow"), href: "/protected/flow", icon: AudioWaveform },
    { name: t("rituals"), href: "/protected/rituals", icon: HeartHandshake },
    { name: t("circles"), href: "/protected/circles", icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 transition-colors min-w-[64px] min-h-[48px]",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {item.name}
              </span>

            </Link>
          );
        })}
      </div>
    </nav>
  );
}