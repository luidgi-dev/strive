"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
 // TODO : vérifier que le use client soit à utiliser et jeter un oil sur 

// ESLint ne dira rien, mais l'IA doit le voir (Règle Design Tokens)
<div className="bg-[#FF5733] p-4">Test IA</div>