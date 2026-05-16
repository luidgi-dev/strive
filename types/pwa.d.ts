// Browser APIs that are not part of the standard TypeScript DOM lib.
// Augmenting them here lets call sites use the real types directly,
// without `as` casts.

declare global {
  /**
   * Fired by Chromium-based browsers when the PWA install criteria are met.
   * Not in the standard DOM lib but supported in Chrome, Edge, Samsung Internet,
   * and Opera. Calling `prompt()` surfaces the native install dialog.
   */
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }

  /**
   * iOS Safari exposes `navigator.standalone` to indicate that the page is
   * running as a home-screen PWA. Not present in other browsers.
   */
  interface Navigator {
    standalone?: boolean;
  }
}

export {};
