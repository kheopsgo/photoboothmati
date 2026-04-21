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

  // Configurable latency offset (ms). Real /take-photo fires this many ms
  // before the end of the visible countdown. Visible countdown is unaffected.
  const captureOffsetMs = Math.max(
    0,
    Math.min(COUNTDOWN_TOTAL_MS, settings.captureOffsetMs ?? 1500)
  );

  // Fires the real capture (API call + flash + sound). Independent from the
  // visible countdown number — driven by a separate setTimeout.
  const triggerCapture = useCallback(() => {
    if (hasTriggeredCapture.current) return;
    hasTriggeredCapture.current = true;

    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    // Start the /take-photo request in the background. CaptureFlow will await
    // this same promise instead of issuing a new request.
    startEarlyCapture(filter).catch(() => {
      // Errors are surfaced/handled by CaptureFlow when it awaits the promise.
    });
  }, [filter]);

  // Reset state between shots (4-photo mode) when captureProgress changes.
  useEffect(() => {
    hasTriggeredCapture.current = false;
    clearPendingCapture();
    setCount(COUNTDOWN_START);
    setShowSmile(false);
    setFlash(false);
  }, [captureProgress]);

  // Schedule the real capture independently from the visual countdown.
  // The visible countdown is NEVER tied to this timer — it always runs the
  // full 3 → 2 → 1 → 0 sequence regardless of when capture is triggered.
  useEffect(() => {
    const captureDelay = Math.max(0, COUNTDOWN_TOTAL_MS - captureOffsetMs);
    const captureTimer = setTimeout(() => {
      triggerCapture();
    }, captureDelay);
    return () => clearTimeout(captureTimer);
  }, [captureProgress, triggerCapture, captureOffsetMs]);

  // Pure visual countdown — drives only what's displayed on screen.
  // After reaching 0, navigate to capturing screen which will await the
  // already-in-flight (or fresh) /take-photo promise.
  useEffect(() => {
    if (count <= 0) {
      playShutter();
      const navTimer = setTimeout(() => {
        setScreen("capturing");
      }, 250);
      return () => clearTimeout(navTimer);
    }

    if (count <= 2) {
      setShowSmile(true);
    }

    const timer = setTimeout(() => {
      playTick();
      setCount((c) => c - 1);
    }, TICK_MS);

    return () => clearTimeout(timer);
  }, [count, playTick, playShutter, setScreen]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-background">
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

        {/* Foreground sharp preview, centered, no cropping */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            ref={streamImgRef}
            src={streamUrl}
            alt="Aperçu caméra en direct"
            className="max-h-full max-w-full h-auto w-auto object-contain drop-shadow-2xl"
            style={{ transform: "scaleX(-1)" }}
            loading="eager"
          />
        </div>
      </div>

      {flash && <div className="absolute inset-0 z-50 animate-flash bg-primary-foreground" />}

      {mode === "four" && (
        <div className="absolute left-0 right-0 top-12 z-30 text-center animate-float-up">
          <p className="font-display text-2xl text-muted-foreground drop-shadow-sm">
            Photo {currentShot} sur {totalShots}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            {Array.from({ length: totalShots }).map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                  i < currentShot ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {count > 0 && (
        <div
          key={`${captureProgress}-${count}`}
          className="relative z-30 animate-countdown-pop"
        >
          <span className="select-none font-display text-[12rem] font-light leading-none text-primary drop-shadow-lg">
            {count}
          </span>
        </div>
      )}

      {showSmile && count > 0 && (
        <p className="relative z-30 mt-4 font-display text-3xl italic text-muted-foreground drop-shadow-sm animate-float-up">
          Souriez
        </p>
      )}

      {count <= 0 && !flash && (
        <div className="relative z-30 animate-countdown-pop">
          <span className="font-display text-6xl text-primary">📸</span>
        </div>
      )}
    </div>
  );
}
