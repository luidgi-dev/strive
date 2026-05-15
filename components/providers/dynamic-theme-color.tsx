"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/theme-colors";

export function DynamicThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;

    // iOS PWA WebView only re-evaluates the status bar when a theme-color meta
    // node is added — mutating an existing node's content waits for the next
    // navigation gesture. Strip every existing tag (including the SSR
    // media-queried ones) and append a fresh single source of truth.
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.remove());

    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  }, [resolvedTheme]);

  return null;
}
