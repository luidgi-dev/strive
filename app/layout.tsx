// app/layout.tsx
import type { Metadata } from "next";
import { DM_Sans, Geist, Geist_Mono, Sora } from "next/font/google";
import { getLocale } from "next-intl/server";

import { DynamicThemeColor } from "@/components/providers/dynamic-theme-color";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { appleSplashScreens } from "@/lib/apple-splash-screens";

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
  metadataBase: new URL(process.env.STRIVE_LIVE_URL ?? "https://striveapp.cc"),
  title: "Strive",
  description: "Consistency over intensity.",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Strive",
    statusBarStyle: "default",
    startupImage: appleSplashScreens,
  },
  // Next emits the standard `mobile-web-app-capable` but not Apple's legacy
  // tag, which iOS still needs to honor apple-touch-startup-image (the launch
  // screen) even when the manifest already puts the PWA in standalone mode.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
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

// theme-color is intentionally not declared via the viewport export.
// It's owned by DynamicThemeColor so the status bar follows the resolved
// app theme (system or user override), not just the OS media query.

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
