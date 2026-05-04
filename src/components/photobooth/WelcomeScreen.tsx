import { useState, useMemo, useRef } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
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
  const [showSettings, setShowSettings] = useState(false);

  const handleStart = () => {
    // Best-effort fullscreen + landscape lock on first user gesture
    enterFullscreen();

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

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <BubblesBackground />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-5 right-5 z-20 w-12 h-12 rounded-full bg-card/60 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:border-primary/50 transition-all"
        aria-label="Paramètres"
      >
        <Settings size={20} />
      </button>

      {/* Two-column landscape layout */}
      <div className="relative z-10 flex w-full h-full items-center justify-center gap-16 px-16 animate-float-in">
        {/* Left: branding */}
        <div className="flex flex-col items-center gap-8 flex-1 max-w-md">
          <div className="relative animate-idle-bob">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-gentle-pulse" />
            <div className="relative w-40 h-40 rounded-full border-2 border-primary/50 flex items-center justify-center bg-card/80 backdrop-blur-sm shadow-glow">
              {settings.eventConfig.logoUrl ? (
                <img src={settings.eventConfig.logoUrl} alt="Logo" className="h-24 w-auto object-contain" />
              ) : (
                <span className="font-script text-7xl text-primary text-glow-yellow">
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
              Immortalisez ce moment
              <Sparkles size={20} className="text-primary" />
            </p>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex flex-col items-center gap-6 flex-1 max-w-md">
          <button
            onClick={handleStart}
            className="group relative animate-glow-pulse rounded-full bg-primary text-primary-foreground px-20 h-[140px] font-display text-5xl font-semibold tracking-wide active:scale-95 transition-transform duration-200 flex items-center gap-4"
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
    </div>
  );
}
