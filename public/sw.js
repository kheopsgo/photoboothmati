// Minimal service worker for PWA installability.
// Intentionally does NOT cache assets to avoid serving stale builds.
// API calls and the MJPEG stream are always fetched from the network.

const NETWORK_ONLY_PATHS = [
  "/health",
  "/take-photo",
  "/create-grid",
  "/send-email",
  "/print-photo",
  "/frame-upload",
  "/trash-photos",
  "/update-frontend",
  "/config",
  "/usb-status",
  "/admin/status",
  "/admin/hotspot",
  "/latest-photo",
  "/wifi-networks",
  "/wifi-config",
  "/stream.mjpg",
];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (NETWORK_ONLY_PATHS.some((path) => url.pathname === path || url.pathname.startsWith("/api/"))) {
    event.respondWith(fetch(event.request));
  }
  // Otherwise: let the browser handle the request normally.
});
