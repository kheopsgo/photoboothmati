import { useState, useMemo } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        className="rounded-full bg-primary/30 border border-primary/40 shadow-md shadow-primary/20"
        style={{
          width: size,
          height: size,
          animation: `bubble-rise ${duration}s ease-in infinite ${delay}s, bubble-wobble ${wobble}s ease-in-out infinite ${delay}s`,
        }}
      >
        {/* Inner highlight */}
        <div
          className="absolute rounded-full bg-primary-foreground/60"
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
        size: 8 + Math.random() * 16,
        left: 5 + Math.random() * 90,
        delay: Math.random() * 8,
        duration: 5 + Math.random() * 6,
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
      {/* Fade-out gradient at the top */}
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
      setScreen(settings.filtersEnabled ? "filter" : "countdown");
    } else if (!settings.allowSingle && settings.allowFour) {
      setMode("four");
      setScreen(settings.filtersEnabled ? "filter" : "countdown");
    } else {
      setScreen("mode");
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-8 overflow-hidden">
      {/* Champagne bubbles */}
      <BubblesBackground />

      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-background/80 transition-all"
      >
        <Settings size={18} />
      </button>

      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent z-[2]" />

      <div className="flex flex-col items-center gap-8 animate-float-in z-10">
        {/* Monogram */}
        <div className="w-28 h-28 rounded-full border-2 border-primary/30 flex items-center justify-center bg-background/80 backdrop-blur-sm shadow-lg">
          {settings.eventConfig.logoUrl ? (
            <img src={settings.eventConfig.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
          ) : (
            <span className="font-script text-5xl text-primary tracking-wide">
              {settings.eventConfig.monogram}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="font-display text-5xl font-light text-foreground tracking-wide">
            Photobooth
          </h1>
          <div className="w-16 h-px bg-primary/40 mx-auto" />
          <p className="font-display text-xl text-muted-foreground italic">
            Immortalisez ce moment
          </p>
        </div>

        {/* CTA */}
        <Button
          variant="hero"
          size="touch"
          onClick={handleStart}
          className="mt-4 animate-float-up delay-500"
          style={{ animationFillMode: "both" }}
        >
          Commencer
        </Button>

        <p className="text-sm text-muted-foreground/70 font-body animate-float-up delay-700" style={{ animationFillMode: "both" }}>
          Appuyez pour commencer
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
