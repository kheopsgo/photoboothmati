import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { armFullscreenOnFirstGesture, enterFullscreen } from "./lib/fullscreen";

function installDomMutationGuard() {
  if (typeof Node !== "function" || !Node.prototype) return;

  const nodePrototype = Node.prototype as Node & { __photoboothDomGuardInstalled?: boolean };
  if (nodePrototype.__photoboothDomGuardInstalled) return;
  nodePrototype.__photoboothDomGuardInstalled = true;

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child) as T;
  };
}

installDomMutationGuard();

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
