import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Camera, Grid2X2, ArrowLeft } from "lucide-react";

export default function ModeSelection() {
  const { setMode, setScreen, resetCaptureSession } = usePhotobooth();
  const { settings } = useSettings();

  const select = (mode: "single" | "four") => {
    resetCaptureSession();
    setMode(mode);
    setScreen("preview");
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-10 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <button
        onClick={() => setScreen("welcome")}
        className="self-start flex items-center gap-3 px-5 h-[64px] rounded-full bg-card/70 backdrop-blur-md border-2 border-border text-foreground active:scale-95 active:border-primary transition-all mb-8 z-10"
      >
        <ArrowLeft size={22} />
        <span className="font-display text-lg">Retour</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-12 animate-float-in z-10">
        <div className="text-center space-y-3">
          <h2 className="font-display text-5xl text-foreground">
            Choisissez votre formule
          </h2>
          <div className="w-20 h-px bg-primary/60 mx-auto" />
        </div>

        <div className="flex flex-col gap-6 w-full max-w-lg">
          {settings.allowSingle && (
            <button
              onClick={() => select("single")}
              className="group flex items-center gap-6 p-8 min-h-[140px] rounded-3xl border-2 border-border bg-card/70 backdrop-blur-sm active:scale-[0.97] active:border-primary active:shadow-glow transition-all duration-200"
            >
              <div className="w-24 h-24 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Camera size={48} className="text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="font-display text-4xl text-foreground">1 photo</p>
                <p className="text-lg text-muted-foreground mt-1">Un portrait élégant</p>
              </div>
            </button>
          )}

          {settings.allowFour && (
            <button
              onClick={() => select("four")}
              className="group flex items-center gap-6 p-8 min-h-[140px] rounded-3xl border-2 border-border bg-card/70 backdrop-blur-sm active:scale-[0.97] active:border-primary active:shadow-glow transition-all duration-200"
            >
              <div className="w-24 h-24 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Grid2X2 size={48} className="text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="font-display text-4xl text-foreground">4 photos</p>
                <p className="text-lg text-muted-foreground mt-1">L'expérience photobooth</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
