// app/layout.tsx
import type { Metadata } from "next";
import { Sora, DM_Sans, Geist, Geist_Mono } from "next/font/google"; 
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white dark:bg-black text-slate-900 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}