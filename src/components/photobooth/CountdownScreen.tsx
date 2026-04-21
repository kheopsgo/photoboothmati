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

  useEffect(() => {
    if (count <= 0) {
      return;
    }

    if (count <= 2) {
      setShowSmile(true);
    }

    // When "1" is displayed, trigger the actual capture (API + flash + shutter)
    // immediately to compensate for camera latency. Visually the countdown still
    // ticks to 0 so the user perceives the photo being taken at "0".
    if (count === 1 && !hasTriggeredCapture.current) {
      triggerCapture();
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
  }, [count, playTick, triggerCapture]);

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
