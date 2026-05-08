"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
 // TODO : vérifier que le use client soit à utiliser et jeter un oil sur 
 const badVariable: any = "test"; // (Usage de any -> ERROR)

