// Minimal service worker for PWA installability.
// Intentionally does NOT cache responses to avoid serving stale builds.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let the browser handle all requests normally.
});
