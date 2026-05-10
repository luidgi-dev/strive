// app/[locale]/protected/(app)/layout.tsx
import { ReactNode } from "react";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function InternalAppLayout({ children }: { children: ReactNode }) {
  return (
    <>
    
      {/* */}
      <div className="flex-1 px-6 pb-24 pt-4">
        {children}
      </div>
      <BottomNav />
    </>
  );
}