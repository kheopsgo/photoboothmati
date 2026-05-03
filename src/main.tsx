import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { armFullscreenOnFirstGesture, enterFullscreen } from "./lib/fullscreen";

// Best-effort: try immediately (will likely no-op without a user gesture)
enterFullscreen();
// Arm a one-time listener so the first tap triggers real fullscreen + landscape lock
armFullscreenOnFirstGesture();

// Register a minimal service worker so the app is installable as a PWA.
// Skip registration in iframes / Lovable preview to avoid caching issues.
if ("serviceWorker" in navigator) {
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app");

  if (isInIframe || isPreviewHost) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore */
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
