import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Try to lock the screen orientation to landscape (works in fullscreen / PWA on Android).
const lockLandscape = () => {
  const orientation = (screen as any).orientation;
  if (orientation && typeof orientation.lock === "function") {
    orientation.lock("landscape").catch(() => {
      /* ignored — browsers without fullscreen / kiosk mode reject this */
    });
  }
};

document.addEventListener("click", lockLandscape, { once: true });
lockLandscape();

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
