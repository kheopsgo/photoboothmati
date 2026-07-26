import { useEffect, useState } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useSound } from "@/hooks/useSound";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { Check, RotateCcw, Clock } from "lucide-react";

const REVIEW_TIMEOUT_S = 8;

export default function QuickReviewScreen() {
  const { photos, removeLastPhoto, setScreen, captureProgress, mode } = usePhotobooth();
  const { settings } = useSettings();
  const { playSuccess, playStart } = useSound({ enabled: settings.soundsEnabled });
  const [remaining, setRemaining] = useState(REVIEW_TIMEOUT_S);

  const lastPhoto = photos[photos.length - 1];
  const totalShots = mode === "four" ? 4 : 1;
  const currentShot = captureProgress;

  useEffect(() => {
    playSuccess();
    hapticMedium();
  }, [playSuccess]);

  useEffect(() => {
    if (remaining <= 0) {
      handleKeep();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const handleKeep = () => {
    hapticLight();
    playStart();
    if (currentShot >= totalShots) {
      setScreen("capturing");
    } else {
      setScreen("countdown");
    }
  };

  const handleRetake = () => {
    hapticLight();
    removeLastPhoto();
    setScreen("countdown");
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-10 animate-float-in">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-6 h-[64px] flex items-center rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary/50">
        <span className="font-display text-xl font-semibold text-primary">
          Photo {currentShot}/{totalShots}
        </span>
      </div>

      <div className="z-10 flex flex-col items-center gap-8 w-full max-w-3xl">
        <div className="text-center space-y-2">
          <h2 className="font-display text-5xl text-foreground">Ça vous plaît ?</h2>
          <p className="text-lg text-muted-foreground">Validez pour continuer</p>
        </div>

        <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden border-4 border-primary/30 shadow-glow bg-black">
          {lastPhoto ? (
            <img
              src={lastPhoto}
              alt="Aperçu"
              className="h-full w-full object-cover -rotate-90"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              Aucune photo
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 w-full max-w-2xl">
          <button
            onClick={handleRetake}
            className="flex-1 h-[88px] rounded-2xl border-2 border-border bg-card/70 text-foreground font-display text-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <RotateCcw size={28} />
            Recommencer
          </button>
          <button
            onClick={handleKeep}
            className="flex-1 h-[88px] rounded-2xl bg-primary text-primary-foreground font-display text-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-glow"
          >
            <Check size={32} />
            Valider
          </button>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock size={18} />
          <span className="font-body text-sm">
            Validation automatique dans <span className="font-semibold text-foreground">{remaining}s</span>
          </span>
        </div>
      </div>
    </div>
  );
}
