// Strive service worker — Web Push only.
//
// This worker intentionally does NOT implement offline caching. Its sole job is
// to receive push messages and surface them as notifications, which is the one
// capability Web Push requires a service worker for. Caching/offline support can
// be layered in later without changing the push contract below.
//
// Served from /sw.js with scope "/" so it controls the whole origin.

// Activate immediately instead of waiting for existing tabs to close, so a
// freshly registered worker can handle the very first subscription.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

// A push arrives as an encrypted blob. The server always sends a JSON payload
// shaped like { title, body, url, tag } (see lib/push/server.ts). We defend
// against a missing/!JSON payload so a malformed push never throws.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Strive";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/web-app-manifest-192x192.png",
    badge: payload.badge || "/favicon-96x96.png",
    tag: payload.tag,
    // Deep link consumed by the notificationclick handler below.
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping a notification focuses an existing app tab when one is open,
// otherwise opens a new one at the deep-linked url.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
