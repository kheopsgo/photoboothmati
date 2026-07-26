import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { hapticLight } from "@/lib/haptics";
import { Camera, Grid2X2, ArrowLeft } from "lucide-react";

export default function ModeSelection() {
  const { setMode, setScreen, resetCaptureSession } = usePhotobooth();
  const { settings } = useSettings();

  const select = (mode: "single" | "four") => {
    hapticLight();
    resetCaptureSession();
    setMode(mode);
    setScreen(settings.filtersEnabled ? "filter" : "preview");
  };

  return (
    <div className="flex flex-col h-screen w-full px-10 py-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <button
        onClick={() => setScreen("welcome")}
        className="self-start flex items-center gap-3 px-5 h-[64px] rounded-full bg-card/70 backdrop-blur-md border-2 border-border text-foreground active:scale-95 active:border-primary transition-all z-10"
      >
        <ArrowLeft size={22} />
        <span className="font-display text-lg">Retour</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 animate-float-in z-10 min-h-0">
        <div className="text-center space-y-2">
          <h2 className="font-display text-5xl text-foreground">
            Choisissez votre formule
          </h2>
          <div className="w-20 h-px bg-primary/60 mx-auto" />
        </div>

        <div className="flex flex-row gap-8 w-full max-w-5xl justify-center">
          {settings.allowSingle && (
            <button
              onClick={() => select("single")}
              className="group flex-1 max-w-md flex flex-col items-center gap-5 p-10 min-h-[340px] rounded-3xl border-2 border-border bg-card/70 backdrop-blur-sm active:scale-[0.97] active:border-primary active:shadow-glow transition-all duration-200"
            >
              <div className="w-28 h-28 rounded-3xl bg-primary/15 flex items-center justify-center shrink-0">
                <Camera size={56} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="font-display text-4xl text-foreground">1 photo</p>
                <p className="text-lg text-muted-foreground mt-2">Un portrait élégant</p>
              </div>
            </button>
          )}

          {settings.allowFour && (
            <button
              onClick={() => select("four")}
              className="group flex-1 max-w-md flex flex-col items-center gap-5 p-10 min-h-[340px] rounded-3xl border-2 border-border bg-card/70 backdrop-blur-sm active:scale-[0.97] active:border-primary active:shadow-glow transition-all duration-200"
            >
              <div className="w-28 h-28 rounded-3xl bg-primary/15 flex items-center justify-center shrink-0">
                <Grid2X2 size={56} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="font-display text-4xl text-foreground">4 photos</p>
                <p className="text-lg text-muted-foreground mt-2">L'expérience photobooth</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
