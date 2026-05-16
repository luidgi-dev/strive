"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/theme-colors";

const DYNAMIC_ATTR = "data-dynamic-theme-color";

export function DynamicThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;

    // Only ever remove tags we injected ourselves. Removing nodes that React
    // tracks (e.g. from a viewport export) breaks reconciliation and throws
    // "Cannot read properties of null (reading 'removeChild')" on unmount.
    // iOS PWA WebView also only re-evaluates the status bar when a fresh node
    // is appended, so we strip-and-add rather than mutate.
    document
      .querySelectorAll(`meta[${DYNAMIC_ATTR}]`)
      .forEach((meta) => meta.remove());

    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    meta.setAttribute(DYNAMIC_ATTR, "");
    document.head.appendChild(meta);
  }, [resolvedTheme]);

  return null;
}
