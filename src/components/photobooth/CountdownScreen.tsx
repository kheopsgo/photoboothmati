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
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-black">
      {/* Aperçu live de la caméra (masqué pendant le flash) */}
      {!flash && (
        <img
          src={STREAM_URL}
          alt="Aperçu en direct"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          onError={(e) => {
            // Si le flux n'est pas disponible, on masque proprement l'image
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}

      {/* Voile sombre pour la lisibilité du compte à rebours */}
      {!flash && <div className="absolute inset-0 bg-black/30 z-0" />}

      {/* Flash overlay */}
      {flash && (
        <div className="absolute inset-0 bg-primary-foreground z-50 animate-flash" />
      )}

      {/* Progress for multi-shot */}
      {mode === "four" && (
        <div className="absolute top-12 left-0 right-0 text-center animate-float-up z-10">
          <p className="font-display text-2xl text-white/90 drop-shadow-lg">
            Photo {currentShot} sur {totalShots}
          </p>
          <div className="flex gap-2 justify-center mt-3">
            {Array.from({ length: totalShots }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  i < currentShot ? "bg-primary" : "bg-white/40"
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
          className={`relative z-10 ${exiting ? "animate-countdown-exit" : "animate-countdown-pop"}`}
        >
          <span className="font-display text-[12rem] font-light text-white leading-none select-none drop-shadow-2xl">
            {count}
          </span>
        </div>
      )}

      {/* Smile prompt */}
      {showSmile && count > 0 && (
        <p className="font-display text-3xl text-white/90 italic animate-float-up mt-4 z-10 drop-shadow-lg">
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
