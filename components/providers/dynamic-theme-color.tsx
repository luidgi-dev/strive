"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/theme-colors";

const DYNAMIC_ATTR = "data-dynamic-theme-color";

export function DynamicThemeColor() {
  const { resolvedTheme } = useTheme();
  // Re-run on every route change too. iOS PWA WebView caches the previous
  // theme-color across soft navigations (chevron back, Link clicks) and only
  // re-evaluates the status bar when a fresh <meta> node is appended. Without
  // this dependency, switching theme inside Settings and then navigating back
  // leaves the iOS status bar stuck on the old color.
  const pathname = usePathname();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;

    // Only ever remove tags we injected ourselves. Removing nodes that React
    // tracks (e.g. from a viewport export) breaks reconciliation and throws
    // "Cannot read properties of null (reading 'removeChild')" on unmount.
    document
      .querySelectorAll(`meta[${DYNAMIC_ATTR}]`)
      .forEach((meta) => meta.remove());

    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    meta.setAttribute(DYNAMIC_ATTR, "");
    document.head.appendChild(meta);
  }, [resolvedTheme, pathname]);

  return null;
}
