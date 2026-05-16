"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, MoreVertical, SquarePlus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Platform = "ios" | "android";

const subscribeStandalone = (callback: () => void) => {
  const mm = window.matchMedia("(display-mode: standalone)");
  mm.addEventListener("change", callback);
  return () => mm.removeEventListener("change", callback);
};

const getStandaloneSnapshot = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const getStandaloneServerSnapshot = () => true;

const subscribePlatform = () => () => {};

const getPlatformSnapshot = (): Platform =>
  /android/i.test(window.navigator.userAgent) ? "android" : "ios";

const getPlatformServerSnapshot = (): Platform => "ios";

export function PwaInstallNotice() {
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot,
  );

  const detectedPlatform = useSyncExternalStore(
    subscribePlatform,
    getPlatformSnapshot,
    getPlatformServerSnapshot,
  );

  const [overridePlatform, setOverridePlatform] = useState<Platform | null>(
    null,
  );
  const platform = overridePlatform ?? detectedPlatform;

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  if (isStandalone) return null;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label="Install Strive on your phone"
            className="fixed right-4 top-4 z-50 flex size-10 items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-card md:right-6 md:top-6"
          >
            <Download className="size-4" />
          </button>
        }
      />
      <SheetContent>
        <div className="mx-auto w-full max-w-md space-y-4">
          <SheetTitle>Install Strive on your phone</SheetTitle>
          <SheetDescription>
            Get the full app experience. No browser chrome.
          </SheetDescription>

          <div className="flex rounded-md bg-muted p-1">
            <button
              type="button"
              onClick={() => setOverridePlatform("ios")}
              aria-pressed={platform === "ios"}
              className={cn(
                "flex-1 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                platform === "ios"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              iOS
            </button>
            <button
              type="button"
              onClick={() => setOverridePlatform("android")}
              aria-pressed={platform === "android"}
              className={cn(
                "flex-1 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                platform === "android"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              Android
            </button>
          </div>

          {platform === "ios" ? (
            <ol className="space-y-3 pt-2">
              <Step number={1}>Open this page in Safari.</Step>
              <Step number={2}>
                Tap the Share button{" "}
                <Upload className="inline-block size-3.5 align-text-bottom text-muted-foreground" />{" "}
                at the bottom of the screen.
              </Step>
              <Step number={3}>
                Scroll down and tap &quot;Add to Home Screen&quot;{" "}
                <SquarePlus className="inline-block size-3.5 align-text-bottom text-muted-foreground" />
                .
              </Step>
              <Step number={4}>Tap &quot;Add&quot;.</Step>
            </ol>
          ) : (
            <div className="space-y-4 pt-2">
              {deferredPrompt && (
                <>
                  <Button
                    onClick={handleAndroidInstall}
                    className="h-11 w-full rounded-md text-sm"
                  >
                    Install Strive
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Or do it manually:
                  </p>
                </>
              )}
              <ol className="space-y-3">
                <Step number={1}>Open this page in Chrome.</Step>
                <Step number={2}>
                  Tap the menu{" "}
                  <MoreVertical className="inline-block size-3.5 align-text-bottom text-muted-foreground" />{" "}
                  in the top-right.
                </Step>
                <Step number={3}>
                  Tap &quot;Add to Home Screen&quot; or &quot;Install app&quot;.
                </Step>
                <Step number={4}>Confirm.</Step>
              </ol>
            </div>
          )}

          <SheetClose
            render={
              <Button variant="ghost" className="mt-2 h-10 w-full">
                Close
              </Button>
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
        {number}
      </span>
      <span className="text-sm leading-relaxed">{children}</span>
    </li>
  );
}
