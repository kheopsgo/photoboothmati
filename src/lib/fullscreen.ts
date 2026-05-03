// Helpers for entering fullscreen + locking landscape on tablets.
// Failures are swallowed — fullscreen is best-effort.

export async function enterFullscreen(): Promise<boolean> {
  try {
    const el = document.documentElement as any;
    if (!document.fullscreenElement) {
      const req =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen;
      if (req) {
        await req.call(el, { navigationUI: "hide" }).catch(() => req.call(el));
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const orientation = (screen as any).orientation;
    if (orientation && typeof orientation.lock === "function") {
      await orientation.lock("landscape").catch(() => {});
    }
  } catch {
    /* ignore */
  }

  return !!document.fullscreenElement;
}

export function exitFullscreen() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

export function isFullscreen(): boolean {
  return !!document.fullscreenElement;
}

/** Register a one-time global listener that triggers fullscreen on the first user gesture. */
export function armFullscreenOnFirstGesture() {
  const handler = () => {
    enterFullscreen();
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("touchstart", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("pointerdown", handler, { once: true, passive: true });
  window.addEventListener("touchstart", handler, { once: true, passive: true });
  window.addEventListener("keydown", handler, { once: true });
}
