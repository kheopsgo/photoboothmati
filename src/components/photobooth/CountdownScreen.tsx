import { useEffect, useState, useCallback, useRef } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSound } from "@/hooks/useSound";
import { API_BASE } from "@/services/api";

export default function CountdownScreen() {
  const { mode, setScreen, captureProgress } = usePhotobooth();
  const { playTick, playShutter } = useSound();
  const [count, setCount] = useState(3);
  const [showSmile, setShowSmile] = useState(false);
  const [flash, setFlash] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [isStreamMounted, setIsStreamMounted] = useState(false);
  const hasTriggeredCapture = useRef(false);
  const streamImgRef = useRef<HTMLImageElement | null>(null);

  const totalShots = mode === "four" ? 4 : 1;
  const currentShot = captureProgress + 1;
  const streamUrl = import.meta.env.VITE_STREAM_URL || `${API_BASE}/stream.mjpg`;

  // Offset (ms) before the visual end of the countdown at which the real
  // capture is triggered, to compensate for camera latency. The visible
  // countdown (3 → 2 → 1 → 0) is NOT affected by this value.
  const CAPTURE_OFFSET_MS = 1500;
  const COUNTDOWN_TOTAL_MS = 3000; // 3 seconds: 3 → 2 → 1 → 0

  const triggerCapture = useCallback(() => {
    if (hasTriggeredCapture.current) return;
    hasTriggeredCapture.current = true;

    // Flash + shutter sound fire at the exact moment the capture API is called
    playShutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 180);

    // Navigate to capturing screen which performs the /take-photo request
    setScreen("capturing");
  }, [playShutter, setScreen]);

  useEffect(() => {
    setIsStreamMounted(Boolean(streamImgRef.current));
  }, []);

  // Reset capture trigger + countdown between shots (4-photo mode)
  useEffect(() => {
    hasTriggeredCapture.current = false;
    setCount(3);
    setShowSmile(false);
    setFlash(false);
  }, [captureProgress]);

  // Schedule the real capture independently from the visual countdown.
  // This way the user always sees 3 → 2 → 1 → 0, while the API call fires
  // earlier (COUNTDOWN_TOTAL_MS - CAPTURE_OFFSET_MS) to compensate for latency.
  useEffect(() => {
    const captureDelay = Math.max(0, COUNTDOWN_TOTAL_MS - CAPTURE_OFFSET_MS);
    const captureTimer = setTimeout(() => {
      triggerCapture();
    }, captureDelay);
    return () => clearTimeout(captureTimer);
  }, [captureProgress, triggerCapture]);

  // Pure visual countdown — drives only what's displayed on screen.
  useEffect(() => {
    if (count <= 0) {
      return;
    }

    if (count <= 2) {
      setShowSmile(true);
    }

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setExiting(false);
        playTick();
        setCount((c) => c - 1);
      }, 250);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, playTick]);

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
            style={{ transform: "none" }}
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
          className={`relative z-30 ${exiting ? "animate-countdown-exit" : "animate-countdown-pop"}`}
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
