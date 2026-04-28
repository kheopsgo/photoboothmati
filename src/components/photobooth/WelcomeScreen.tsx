import { useState, useMemo } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Settings, Camera, Sparkles } from "lucide-react";
import SettingsPanel from "./SettingsPanel";

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
    for (let i = 0; i < 24; i++) {
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
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background via-background/80 to-transparent z-[1] pointer-events-none" />
    </>
  );
}

export default function WelcomeScreen() {
  const { setScreen, setMode } = usePhotobooth();
  const { settings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const handleStart = () => {
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
    <div className="relative flex flex-col items-center justify-center min-h-screen px-8 overflow-hidden">
      <BubblesBackground />

      {/* Soft ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-card/60 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground/50 hover:text-primary hover:border-primary/50 transition-all"
        aria-label="Paramètres"
      >
        <Settings size={18} />
      </button>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent z-[2]" />

      <div className="relative flex flex-col items-center gap-10 animate-float-in z-10">
        {/* Logo / monogram with glow */}
        <div className="relative animate-idle-bob">
          <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-gentle-pulse" />
          <div className="relative w-32 h-32 rounded-full border-2 border-primary/50 flex items-center justify-center bg-card/80 backdrop-blur-sm shadow-glow">
            {settings.eventConfig.logoUrl ? (
              <img src={settings.eventConfig.logoUrl} alt="Logo" className="h-20 w-auto object-contain" />
            ) : (
              <span className="font-script text-6xl text-primary text-glow-yellow">
                {settings.eventConfig.monogram}
              </span>
            )}
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className="font-display text-7xl md:text-8xl font-light text-foreground tracking-wide">
            Photobooth
          </h1>
          <div className="w-28 h-px bg-primary/60 mx-auto" />
          <p className="font-display text-3xl text-muted-foreground italic flex items-center justify-center gap-3">
            <Sparkles size={24} className="text-primary" />
            Immortalisez ce moment
            <Sparkles size={24} className="text-primary" />
          </p>
        </div>

        {/* Massive luminous CTA */}
        <button
          onClick={handleStart}
          className="group relative mt-4 animate-glow-pulse rounded-full bg-primary text-primary-foreground px-20 h-[140px] font-display text-5xl font-semibold tracking-wide active:scale-95 transition-transform duration-200 flex items-center gap-4"
        >
          <Camera size={44} />
          Démarrer
        </button>

        <p className="text-lg text-muted-foreground/70 font-body animate-gentle-pulse">
          Touchez l'écran pour commencer
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
