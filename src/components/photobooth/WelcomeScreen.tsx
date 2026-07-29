import { useState, useRef, useMemo } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useBackendHealth } from "@/contexts/BackendHealthContext";
import { useSound } from "@/hooks/useSound";
import { hapticMedium } from "@/lib/haptics";
import { Settings, Camera, Sparkles } from "lucide-react";
import SettingsPanel from "./SettingsPanel";
import PinPrompt from "./PinPrompt";
import { enterFullscreen } from "@/lib/fullscreen";

const LONG_PRESS_MS = 5000;

interface BubbleProps {
  size: number;
  left: number;
  delay: number;
  duration: number;
  wobble: number;
}

function ChampagneBubble({ size, left, delay, duration, wobble }: BubbleProps) {
  return (
    <div
      className="absolute bottom-0 pointer-events-none"
      style={{ left: `${left}%`, animationDelay: `${delay}s` }}
    >
      <div
        className="rounded-full bg-primary/20 border border-primary/30"
        style={{
          width: size,
          height: size,
          boxShadow: `0 0 ${size}px hsl(var(--primary) / 0.5)`,
          animation: `bubble-rise ${duration}s ease-in infinite ${delay}s, bubble-wobble ${wobble}s ease-in-out infinite ${delay}s`,
        }}
      >
        <div
          className="absolute rounded-full bg-primary/70"
          style={{
            width: size * 0.35,
            height: size * 0.35,
            top: size * 0.15,
            left: size * 0.2,
          }}
        />
      </div>
    </div>
  );
}

function BubblesBackground() {
  const bubbles = useMemo<BubbleProps[]>(() => {
    const result: BubbleProps[] = [];
    for (let i = 0; i < 30; i++) {
      result.push({
        size: 8 + Math.random() * 18,
        left: 5 + Math.random() * 90,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 6,
        wobble: 2 + Math.random() * 3,
      });
    }
    return result;
  }, []);

  return (
    <>
      {bubbles.map((b, i) => (
        <ChampagneBubble key={i} {...b} />
      ))}
    </>
  );
}

export default function WelcomeScreen() {
  const { setScreen, setMode } = usePhotobooth();
  const { settings } = useSettings();
  const { online } = useBackendHealth();
  const { playStart } = useSound({ enabled: settings.soundsEnabled });
  const [showSettings, setShowSettings] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const pressTimer = useRef<number | null>(null);

  const startLongPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => {
      if (settings.lockedMode) {
        setShowPin(true);
      } else {
        setShowSettings(true);
      }
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleStart = () => {
    enterFullscreen();
    hapticMedium();
    playStart();

    if (settings.allowSingle && !settings.allowFour) {
      setMode("single");
      setScreen("preview");
    } else if (!settings.allowSingle && settings.allowFour) {
      setMode("four");
      setScreen("preview");
    } else {
      setScreen("mode");
    }
  };

  const welcomeText =
    settings.welcomeMessage ||
    settings.eventConfig.welcomeMessage ||
    "Immortalisez ce moment";

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <BubblesBackground />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <button
        onClick={() => window.location.reload()}
        className="absolute top-5 left-5 z-20 w-12 h-12 rounded-full bg-card/60 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:border-primary/50 transition-all"
        aria-label="Rafraîchir la page"
      >
        <RefreshCw size={20} />
      </button>


      {!settings.lockedMode && (
        <button
          onClick={() => setShowSettings(true)}
          className="absolute top-5 right-5 z-20 w-12 h-12 rounded-full bg-card/60 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:border-primary/50 transition-all"
          aria-label="Paramètres"
        >
          <Settings size={20} />
        </button>
      )}

      <div className="relative z-10 flex w-full h-full items-center justify-center gap-16 px-16 animate-float-in">
        <div className="flex flex-col items-center gap-8 flex-1 max-w-md">
          <div
            className="relative animate-idle-bob cursor-pointer select-none"
            onPointerDown={startLongPress}
            onPointerUp={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-gentle-pulse" />
            <div className="relative w-40 h-40 rounded-full border-2 border-primary/50 flex items-center justify-center bg-card/80 backdrop-blur-sm shadow-glow">
              {settings.eventConfig.logoUrl ? (
                <img src={settings.eventConfig.logoUrl} alt="Logo" className="h-24 w-auto object-contain pointer-events-none" />
              ) : (
                <span className="font-script text-7xl text-primary text-glow-yellow pointer-events-none">
                  {settings.eventConfig.monogram}
                </span>
              )}
            </div>
          </div>

          <div className="text-center space-y-3">
            <h1 className="font-display text-7xl font-light text-foreground tracking-wide">
              Photobooth
            </h1>
            <div className="w-24 h-px bg-primary/60 mx-auto" />
            <p className="font-display text-2xl text-muted-foreground italic flex items-center justify-center gap-2">
              <Sparkles size={20} className="text-primary" />
              {welcomeText}
              <Sparkles size={20} className="text-primary" />
            </p>
            {(settings.eventConfig.title || settings.eventConfig.subtitle) && (
              <div className="pt-2">
                <p className="font-display text-3xl text-primary text-glow-yellow">
                  {settings.eventConfig.title}
                </p>
                <p className="font-body text-lg text-muted-foreground">
                  {settings.eventConfig.subtitle}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 flex-1 max-w-md">
          <button
            onClick={handleStart}
            disabled={online === false}
            className="group relative animate-glow-pulse rounded-full bg-primary text-primary-foreground px-20 h-[140px] font-display text-5xl font-semibold tracking-wide active:scale-95 transition-transform duration-200 flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none"
          >
            <Camera size={44} />
            Démarrer
          </button>
          <p className="text-base text-muted-foreground/70 font-body animate-gentle-pulse">
            Touchez l'écran pour commencer
          </p>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showPin && (
        <PinPrompt
          onSuccess={() => {
            setShowPin(false);
            setShowSettings(true);
          }}
          onCancel={() => setShowPin(false)}
        />
      )}
    </div>
  );
}
