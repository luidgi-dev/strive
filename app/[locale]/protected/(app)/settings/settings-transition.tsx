import { ReactNode } from "react";

export function SettingsTransition({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in slide-in-from-right-4 fade-in duration-500 ease-out">
      {children}
    </div>
  );
}
