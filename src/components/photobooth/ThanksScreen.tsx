import { useEffect, useState } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSound } from "@/hooks/useSound";
import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import RotatedPortraitImage from "./RotatedPortraitImage";

const HOME_TIMEOUT_S = 6;

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 3,
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
        hue: Math.random() > 0.5 ? "hsl(48 100% 60%)" : "hsl(45 30% 96%)",
        key: i,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.hue,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            borderRadius: 2,
            boxShadow: `0 0 8px ${p.hue}`,
          }}
        />
      ))}
    </div>
  );
}

export default function ThanksScreen() {
  const { restart, finalImage } = usePhotobooth();
  const { settings } = useSettings();
  const { playSuccess } = useSound({ enabled: settings.soundsEnabled });
  const [remaining, setRemaining] = useState(HOME_TIMEOUT_S);

  useEffect(() => {
    playSuccess();
  }, [playSuccess]);

  useEffect(() => {
    if (remaining <= 0) {
      restart();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, restart]);

  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full px-8 overflow-hidden">
      <Confetti />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-float-in text-center max-w-2xl">
        <div className="text-7xl animate-idle-bob">🎉</div>
        <h1 className="font-display text-6xl text-foreground text-glow-yellow">
          Merci !
        </h1>
        <div className="w-20 h-px bg-primary/60" />
        <p className="font-display text-2xl text-muted-foreground italic flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          À très vite pour de nouveaux souvenirs
          <Sparkles size={20} className="text-primary" />
        </p>

        {finalImage && (
          <RotatedPortraitImage
            src={finalImage}
            alt="Votre souvenir"
            className="w-40 aspect-[3/4] rounded-xl border-2 border-primary/30 shadow-glow bg-black"
          />
        )}

        <p className="text-sm text-muted-foreground">
          Retour à l'accueil dans <span className="font-semibold text-foreground">{remaining}s</span>
        </p>

        <button
          onClick={restart}
          className="mt-2 rounded-full bg-primary text-primary-foreground px-10 py-5 font-display text-xl font-semibold active:scale-95 transition-transform shadow-glow"
        >
          Recommencer
        </button>
      </div>
    </div>
  );
}
