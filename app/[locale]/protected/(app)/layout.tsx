// app/[locale]/protected/(app)/layout.tsx
import { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { BottomNav } from "@/components/ui/bottom-nav";
import { StriveAiFab } from "@/components/ui/strive-ai-fab";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function InternalAppLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <div className="flex-1 px-6 pb-32 pt-4">
        {children}
      </div>
      <StriveAiFab />
      <BottomNav />
    </>
  );
}
