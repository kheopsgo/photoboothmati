import { useEffect, useState, useCallback, useRef } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSound } from "@/hooks/useSound";
import { API_BASE } from "@/services/api";
import { startEarlyCapture, clearPendingCapture } from "@/services/captureQueue";

// Visual countdown total: 5s (5 → 4 → 3 → 2 → 1 → 0, ticking once per second).
const COUNTDOWN_START = 5;
const COUNTDOWN_TOTAL_MS = COUNTDOWN_START * 1000;
const TICK_MS = 1000;

export default function CountdownScreen() {
  const { mode, filter, setScreen, captureProgress } = usePhotobooth();
  const { settings } = useSettings();
  const { playTick, playShutter } = useSound();
  const [count, setCount] = useState(COUNTDOWN_START);
  const [showSmile, setShowSmile] = useState(false);
  const [flash, setFlash] = useState(false);
  const hasTriggeredCapture = useRef(false);
  const streamImgRef = useRef<HTMLImageElement | null>(null);

  const totalShots = mode === "four" ? 4 : 1;
  const currentShot = captureProgress + 1;
  const streamUrl = import.meta.env.VITE_STREAM_URL || `${API_BASE}/stream.mjpg`;

  // Real /take-photo is fired when the visible countdown reaches "2"
  // (i.e. ~2s before the end), to compensate for camera hardware latency.
  // The visible countdown is never blocked by the capture itself.
  const CAPTURE_AT_COUNT = 2;

  // Fires the real capture (API call + flash + sound). Independent from the
  // visible countdown number — driven by a separate setTimeout.
  const triggerCapture = useCallback(() => {
    if (hasTriggeredCapture.current) return;
    hasTriggeredCapture.current = true;

    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    // Start the single-shot /take-photo request in the background.
    // CaptureFlow will await this same promise instead of issuing a new one.
    startEarlyCapture(filter, null, mode ?? "single").catch(() => {
      // Errors are surfaced/handled by CaptureFlow when it awaits the promise.
    });
  }, [filter, mode]);

  // Reset state between shots (4-photo mode) when captureProgress changes.
  useEffect(() => {
    hasTriggeredCapture.current = false;
    clearPendingCapture();
    setCount(COUNTDOWN_START);
    setShowSmile(false);
    setFlash(false);
  }, [captureProgress]);

  // Pure visual countdown — drives only what's displayed on screen.
  // The real /take-photo is fired when the visible count hits CAPTURE_AT_COUNT
  // (≈2s before the end) to compensate for camera hardware latency.
  useEffect(() => {
    if (count <= 0) {
      playShutter();
      const navTimer = setTimeout(() => {
        setScreen("capturing");
      }, 250);
      return () => clearTimeout(navTimer);
    }

    // Trigger real capture at t=2 (during the "2" frame).
    if (count === CAPTURE_AT_COUNT) {
      triggerCapture();
    }

    // "Souriez" only at the very end (during "1"), not while "2" is shown.
    if (count <= 1) {
      setShowSmile(true);
    }

    const timer = setTimeout(() => {
      playTick();
      setCount((c) => c - 1);
    }, TICK_MS);

    return () => clearTimeout(timer);
  }, [count, playTick, playShutter, setScreen, triggerCapture]);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full overflow-hidden bg-background">
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-200 pointer-events-none ${
          flash ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={flash}
      >
        {/* Blurred background layer (same stream, fills container) */}
        <img
          src={streamUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl brightness-75"
          style={{ transform: "scaleX(-1) scale(1.1)" }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-background/30" />

        {/* Foreground sharp preview, portrait-cropped to match final print */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-full aspect-[3/4] max-h-full max-w-full overflow-hidden rounded-2xl drop-shadow-2xl bg-black">
            <img
              ref={streamImgRef}
              src={streamUrl}
              alt="Aperçu caméra en direct"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
              loading="eager"
            />
          </div>
        </div>
      </div>

      {flash && <div className="absolute inset-0 z-50 animate-flash bg-primary-foreground" />}

      {mode === "four" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-6 h-[64px] flex items-center rounded-full bg-background/75 backdrop-blur-md border-2 border-primary/50">
          <span className="font-display text-xl font-semibold text-primary">
            Photo {currentShot}/{totalShots}
          </span>
        </div>
      )}

      {count > 0 && (
        <div
          key={`${captureProgress}-${count}`}
          className="relative z-30 animate-countdown-pop"
        >
          <span className="select-none font-display text-[14rem] font-light leading-none text-countdown drop-shadow-[0_0_50px_hsl(var(--primary)/0.8)]">
            {count}
          </span>
        </div>
      )}

      {showSmile && count > 0 && (
        <p className="relative z-30 mt-4 font-display text-6xl font-semibold text-countdown drop-shadow-[0_0_30px_hsl(var(--primary)/0.7)] animate-float-up">
          Souriez 😄
        </p>
      )}

      {count <= 0 && !flash && (
        <div className="relative z-30 animate-countdown-pop">
          <span className="font-display text-8xl text-countdown">📸</span>
        </div>
      )}
    </div>
  );
}
