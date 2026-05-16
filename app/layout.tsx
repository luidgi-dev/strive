// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist, Geist_Mono, Sora } from "next/font/google";
import { getLocale } from "next-intl/server";

import { DynamicThemeColor } from "@/components/providers/dynamic-theme-color";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/theme-colors";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Strive",
  description: "Consistency over intensity.",
  icons: {
    icon: [
      {
        url: "/strive-app-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/strive-app-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      { url: "/strive-app-dark.svg", type: "image/svg+xml" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR_DARK },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${sora.variable} ${dmSans.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DynamicThemeColor />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
