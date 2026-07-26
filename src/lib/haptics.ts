export function hapticLight() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(15);
    } catch {
      // ignore
    }
  }
}

export function hapticMedium() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(30);
    } catch {
      // ignore
    }
  }
}

export function hapticSuccess() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([20, 40, 60]);
    } catch {
      // ignore
    }
  }
}

export function hapticCapture() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([10, 30, 80]);
    } catch {
      // ignore
    }
  }
}
