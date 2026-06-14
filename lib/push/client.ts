// Browser-side Web Push helpers. Client-only — every export touches
// `navigator`, `window` or `Notification`, so call these from "use client"
// components behind a support check.
import type { Locale } from "@/lib/locales";

const SW_URL = "/sw.js";

export type PushState = "unsupported" | "denied" | "off" | "on";

/**
 * Web Push needs a service worker, the Push API and the Notification API. On
 * iOS all three exist ONLY once the PWA is installed to the home screen, so this
 * doubles as the "is the platform able to receive push at all" gate.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * True when running as an installed PWA (standalone display). iOS exposes the
 * non-standard `navigator.standalone`; everyone else honors the display-mode
 * media query. Used to tell iOS users they must install before enabling push.
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // `standalone` is iOS-only and absent from the lib.dom types.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// VAPID's applicationServerKey must be a Uint8Array; the public key ships as a
// URL-safe base64 string, so we decode it here.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SW_URL);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_URL);
}

/** Reflects the current opt-in state without mutating anything. */
export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const registration = await navigator.serviceWorker.getRegistration(SW_URL);
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "on" : "off";
}

/**
 * Full opt-in: register the worker, ask for permission (must be triggered by a
 * user gesture), subscribe, and persist the subscription server-side tagged
 * with the user's current locale so notifications are sent in their language.
 * Returns the resulting state.
 */
export async function enablePush(locale: Locale): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return permission === "denied" ? "denied" : "off";
  }

  const registration = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast: the decoded key is ArrayBuffer-backed at runtime, but TS widens
      // Uint8Array's buffer to ArrayBufferLike which BufferSource rejects.
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    }));

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), locale }),
  });
  if (!res.ok) throw new Error("Failed to save push subscription");

  return "on";
}

/** Full opt-out: drop the browser subscription and delete it server-side. */
export async function disablePush(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";

  const registration = await navigator.serviceWorker.getRegistration(SW_URL);
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
  }
  return "off";
}
