import { useState } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Heart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import SettingsPanel from "./SettingsPanel";

const FloatingPetal = ({ delay, left }: { delay: number; left: number }) => (
  <div
    className="absolute bottom-0 text-primary/20 animate-petal pointer-events-none"
    style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${6 + Math.random() * 4}s` }}
  >
    <Heart size={12 + Math.random() * 12} />
  </div>
);

export default function WelcomeScreen() {
  const { setScreen, setMode } = usePhotobooth();
  const { settings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const handleStart = () => {
    // If only one mode available, skip mode selection
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
      {/* Floating petals */}
      {[...Array(6)].map((_, i) => (
        <FloatingPetal key={i} delay={i * 1.3} left={10 + i * 15} />
      ))}

      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground hover:bg-background/80 transition-all"
      >
        <Settings size={18} />
      </button>

      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="flex flex-col items-center gap-8 animate-float-in z-10">
        {/* Monogram */}
        <div className="w-28 h-28 rounded-full border-2 border-primary/30 flex items-center justify-center bg-background/80 backdrop-blur-sm shadow-lg">
          {settings.eventConfig.logoUrl ? (
            <img src={settings.eventConfig.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
          ) : (
            <span className="font-display text-4xl text-primary font-semibold tracking-wide">
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

      {/* Settings panel */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
