"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/theme-colors";

export function DynamicThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const color = resolvedTheme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", color));
  }, [resolvedTheme]);

  return null;
}
