import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Camera, Grid2X2, ArrowLeft } from "lucide-react";

export default function ModeSelection() {
  const { setMode, setScreen } = usePhotobooth();
  const { settings } = useSettings();

  const select = (mode: "single" | "four") => {
    setMode(mode);
    setScreen(settings.filtersEnabled ? "filter" : "countdown");
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-10">
      <button
        onClick={() => setScreen("welcome")}
        className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        <span className="font-body text-sm">Retour</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 animate-float-in">
        <div className="text-center space-y-2">
          <h2 className="font-display text-4xl text-foreground">
            Choisissez votre formule
          </h2>
          <div className="w-12 h-px bg-primary/40 mx-auto" />
        </div>

        <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
          {settings.allowSingle && (
            <button
              onClick={() => select("single")}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 active:scale-[0.97]"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Camera size={28} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-foreground">1 photo</p>
                <p className="text-sm text-muted-foreground mt-1">Un portrait élégant</p>
              </div>
            </button>
          )}

          {settings.allowFour && (
            <button
              onClick={() => select("four")}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 active:scale-[0.97]"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Grid2X2 size={28} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-foreground">4 photos</p>
                <p className="text-sm text-muted-foreground mt-1">L'expérience photobooth</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
