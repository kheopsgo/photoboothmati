import { useEffect, useState, useCallback, useRef } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSound } from "@/hooks/useSound";
import { STREAM_URL } from "@/services/api";

export default function CountdownScreen() {
  const { mode, setScreen, captureProgress } = usePhotobooth();
  const { playTick, playShutter } = useSound();
  const [count, setCount] = useState(5);
  const [showSmile, setShowSmile] = useState(false);
  const [flash, setFlash] = useState(false);
  const [exiting, setExiting] = useState(false);
  const hasTriggeredCapture = useRef(false);

  const totalShots = mode === "four" ? 4 : 1;
  const currentShot = captureProgress + 1; // 1-based display

  const triggerCapture = useCallback(() => {
    if (hasTriggeredCapture.current) return;
    hasTriggeredCapture.current = true;

    playShutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 500);

    // Lance l'écran de capture presque immédiatement pour réellement réduire la latence
    setTimeout(() => {
      setScreen("capturing");
    }, 120);
  }, [playShutter, setScreen]);

  useEffect(() => {
    if (count <= 0) {
      return;
    }

    if (count === 2) {
      setShowSmile(true);
      triggerCapture();
      return;
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
      {/* Live MJPEG preview */}
      {!flash && (
        <>
          <img
            src={STREAM_URL}
            alt="Aperçu caméra en direct"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          <div className="absolute top-4 left-4 z-40 px-3 py-1 rounded-full bg-primary/80 text-primary-foreground font-display text-sm">
            Aperçu caméra actif
          </div>
          {/* Subtle dark overlay to keep countdown legible */}
          <div className="absolute inset-0 bg-background/30 z-10" />
        </>
      )}

      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-primary-foreground z-50 animate-flash" />
      )}

      {/* Progress for multi-shot */}
      {mode === "four" && (
        <div className="absolute top-12 left-0 right-0 text-center animate-float-up z-30">
          <p className="font-display text-2xl text-muted-foreground">
            Photo {currentShot} sur {totalShots}
          </p>
          <div className="flex gap-2 justify-center mt-3">
            {Array.from({ length: totalShots }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  i < currentShot ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Countdown number */}
      {count > 0 && (
        <div
          key={`${captureProgress}-${count}`}
          className={`relative z-30 ${exiting ? "animate-countdown-exit" : "animate-countdown-pop"}`}
        >
          <span className="font-display text-[12rem] font-light text-primary leading-none select-none drop-shadow-lg">
            {count}
          </span>
        </div>
      )}

      {/* Smile prompt */}
      {showSmile && count > 0 && (
        <p className="font-display text-3xl text-muted-foreground italic animate-float-up mt-4 relative z-30">
          Souriez
        </p>
      )}

      {count <= 0 && !flash && (
        <div className="animate-countdown-pop relative z-30">
          <span className="font-display text-6xl text-primary">📸</span>
        </div>
      )}
    </div>
  );
}
