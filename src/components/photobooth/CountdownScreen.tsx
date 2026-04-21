import { useEffect, useState, useCallback } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSound } from "@/hooks/useSound";

export default function CountdownScreen() {
  const { mode, setScreen, captureProgress } = usePhotobooth();
  const { playTick, playShutter } = useSound();
  const [count, setCount] = useState(5);
  const [showSmile, setShowSmile] = useState(false);
  const [flash, setFlash] = useState(false);
  const [exiting, setExiting] = useState(false);

  const totalShots = mode === "four" ? 4 : 1;
  const currentShot = captureProgress + 1; // 1-based display

  const triggerCapture = useCallback(() => {
    playShutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 500);

    // Always go to capturing after countdown — CaptureFlow handles the logic
    setTimeout(() => {
      setScreen("capturing");
    }, 1000);
  }, [playShutter, setScreen]);

  useEffect(() => {
    if (count <= 0) {
      return;
    }

    if (count === 2) {
      setShowSmile(true);
    }

    // Déclenche la capture quand il reste 2 secondes pour compenser la latence
    if (count === 2) {
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
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-primary-foreground z-50 animate-flash" />
      )}

      {/* Progress for multi-shot */}
      {mode === "four" && (
        <div className="absolute top-12 left-0 right-0 text-center animate-float-up">
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
          className={exiting ? "animate-countdown-exit" : "animate-countdown-pop"}
        >
          <span className="font-display text-[12rem] font-light text-primary leading-none select-none">
            {count}
          </span>
        </div>
      )}

      {/* Smile prompt */}
      {showSmile && count > 0 && (
        <p className="font-display text-3xl text-muted-foreground italic animate-float-up mt-4">
          Souriez
        </p>
      )}

      {count <= 0 && !flash && (
        <div className="animate-countdown-pop">
          <span className="font-display text-6xl text-primary">📸</span>
        </div>
      )}
    </div>
  );
}
