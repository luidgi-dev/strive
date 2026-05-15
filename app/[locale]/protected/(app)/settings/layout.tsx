import { ReactNode } from "react";

import { SettingsTransition } from "./settings-transition";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsTransition>{children}</SettingsTransition>;
}
