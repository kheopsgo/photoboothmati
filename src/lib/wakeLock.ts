import { useEffect } from "react";

// Keeps the tablet screen awake using the Wake Lock API (Android Chrome / PWA).
// The lock is silently re-acquired whenever the tab becomes visible again,
// because the browser drops the lock in the background.

type WakeSentinel = { release: () => Promise<void>; addEventListener?: (type: string, listener: () => void) => void };

let sentinel: WakeSentinel | null = null;
let wanted = false;

async function request(): Promise<boolean> {
  try {
    const wl = (navigator as any).wakeLock;
    if (!wl || typeof wl.request !== "function") return false;
    const s: WakeSentinel = await wl.request("screen");
    sentinel = s;
    s.addEventListener?.("release", () => {
      if (sentinel === s) sentinel = null;
      // If the browser dropped the lock unexpectedly, ask again.
      if (wanted) void request();
    });
  } catch {
    return false;
  }
  return !!sentinel;
}

export async function acquireWakeLock(): Promise<boolean> {
  wanted = true;
  if (sentinel) return true;
  return request();
}

export function releaseWakeLock() {
  wanted = false;
  const s = sentinel;
  sentinel = null;
  try {
    s?.release()?.catch(() => {});
  } catch {
    /* ignore */
  }
}

export function handleVisibilityChange(visible: boolean) {
  if (visible && wanted) void request();
}

/** Holds a screen wake lock while the app is open (and re-acquires it when needed). */
export function useKeepScreenAwake(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      releaseWakeLock();
      return;
    }
    void acquireWakeLock();
    const onVisibility = () => handleVisibilityChange(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      releaseWakeLock();
    };
  }, [enabled]);
}
