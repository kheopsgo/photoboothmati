import { useEffect, useState, useCallback, useRef } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSound } from "@/hooks/useSound";
import { getStreamUrl } from "@/services/cameraStream";
import { startEarlyCapture, clearPendingCapture } from "@/services/captureQueue";
import { hapticCapture, hapticMedium } from "@/lib/haptics";
import RotatedPortraitImage from "./RotatedPortraitImage";

const COUNTDOWN_START = 5;
const TICK_MS = 1000;

export default function CountdownScreen() {
  const { mode, filter, setScreen, captureProgress } = usePhotobooth();
  const { settings } = useSettings();
  const { playTick, playReadyBeep, playShutter } = useSound({
    enabled: settings.soundsEnabled,
  });
  const [count, setCount] = useState(COUNTDOWN_START);
  const [showSmile, setShowSmile] = useState(false);
  const [flash, setFlash] = useState(false);
  const [ringKey, setRingKey] = useState(0);
  const hasTriggeredCapture = useRef(false);

  const totalShots = mode === "four" ? 4 : 1;
  const currentShot = captureProgress + 1;
  // Flux MJPEG unique partagé (identique à l'écran d'aperçu)
  const streamUrl = getStreamUrl();


  const CAPTURE_AT_COUNT = 1;

  const triggerCapture = useCallback(() => {
    if (hasTriggeredCapture.current) return;
    hasTriggeredCapture.current = true;

    setFlash(true);
    hapticCapture();
    setTimeout(() => setFlash(false), 220);

    startEarlyCapture(filter, null, mode ?? "single").catch(() => {
      // Errors are surfaced/handled by CaptureFlow when it awaits the promise.
    });
  }, [filter, mode]);

  useEffect(() => {
    hasTriggeredCapture.current = false;
    clearPendingCapture();
    setCount(COUNTDOWN_START);
    setShowSmile(false);
    setFlash(false);
  }, [captureProgress]);

  useEffect(() => {
    if (count <= 0) {
      playShutter();
      hapticMedium();
      const navTimer = setTimeout(() => {
        setScreen("capturing");
      }, 350);
      return () => clearTimeout(navTimer);
    }

    if (count === CAPTURE_AT_COUNT) {
      triggerCapture();
      playReadyBeep();
      setShowSmile(true);
      setRingKey((k) => k + 1);
    }

    if (count > CAPTURE_AT_COUNT) {
      playTick();
      setRingKey((k) => k + 1);
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, TICK_MS);

    return () => clearTimeout(timer);
  }, [count, playTick, playReadyBeep, playShutter, setScreen, triggerCapture]);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full overflow-hidden bg-background">
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-200 pointer-events-none ${
          flash ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={flash}
      >
        {settings.cameraEnabled ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />

            <div className="absolute inset-0 flex items-center justify-center">
              <RotatedPortraitImage
                src={streamUrl}
                alt="Aperçu caméra en direct"
                mirrored
                className="h-full aspect-[3/4] rounded-2xl drop-shadow-2xl"
              />
            </div>
          </>

        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <p className="font-display text-2xl text-muted-foreground">Caméra désactivée</p>
          </div>
        )}
      </div>

      {flash && <div className="absolute inset-0 z-50 animate-flash-strong bg-primary-foreground" />}

      {mode === "four" && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-6 h-[64px] flex items-center rounded-full bg-background/75 backdrop-blur-md border-2 border-primary/50">
          <span className="font-display text-xl font-semibold text-primary">
            Photo {currentShot}/{totalShots}
          </span>
        </div>
      )}

      {count > 0 && (
        <div className="relative z-30 flex items-center justify-center">
          <div key={ringKey} className="absolute inset-0 rounded-full border-4 border-primary/40 w-80 h-80 animate-countdown-ring" />
          <div
            key={`${captureProgress}-${count}`}
            className="animate-countdown-pulse"
          >
            <span className="select-none font-display text-[14rem] font-light leading-none text-countdown drop-shadow-[0_0_50px_hsl(var(--primary)/0.8)]">
              {count}
            </span>
          </div>
        </div>
      )}

      {showSmile && count > 0 && (
        <p className="relative z-30 mt-4 font-display text-6xl font-semibold text-countdown drop-shadow-[0_0_30px_hsl(var(--primary)/0.7)] animate-smile-pop">
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
