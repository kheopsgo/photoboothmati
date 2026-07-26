import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { API_BASE } from "@/services/api";
import { ArrowLeft, Camera } from "lucide-react";
import type { PhotoFilter } from "@/services/api";

const filters: { id: PhotoFilter; label: string; cssFilter: string }[] = [
  { id: "none", label: "Original", cssFilter: "none" },
  { id: "bw", label: "Noir & blanc", cssFilter: "grayscale(1)" },
  { id: "sepia", label: "Sépia", cssFilter: "sepia(1)" },
];

export default function PreviewScreen() {
  const { mode, filter, setFilter, setScreen, captureProgress } = usePhotobooth();
  const streamUrl = import.meta.env.VITE_STREAM_URL || `${API_BASE}/stream.mjpg`;
  const currentCss = filters.find((f) => f.id === filter)?.cssFilter ?? "none";

  const totalShots = mode === "four" ? 4 : 1;
  const currentShot = Math.min(captureProgress + 1, totalShots);
  const inSequence = mode === "four" && captureProgress > 0;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Blurred fullscreen background */}
      <div className="absolute inset-0 z-0">
        <img
          src={streamUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl brightness-50"
          style={{ transform: "scaleX(-1) scale(1.1)" }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      {/* Left: camera (70%) */}
      <div className="relative z-10 flex-[7] flex flex-col p-6 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setScreen("mode")}
            disabled={inSequence}
            className="flex items-center gap-2 px-5 h-[64px] rounded-full bg-card/70 backdrop-blur-md border-2 border-border text-foreground active:scale-95 active:border-primary transition-all disabled:opacity-50"
          >
            <ArrowLeft size={22} />
            <span className="font-display text-lg">Retour</span>
          </button>
          {mode === "four" && (
            <div className="px-6 h-[64px] flex items-center rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary/50">
              <span className="font-display text-xl text-primary font-semibold">
                Photo {currentShot}/{totalShots}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="relative h-full aspect-[3/4] max-h-full max-w-full overflow-hidden rounded-3xl shadow-2xl ring-2 ring-primary/30 bg-black">
            <img
              src={streamUrl}
              alt="Aperçu caméra en direct"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)", filter: currentCss }}
              loading="eager"
            />
          </div>
        </div>
      </div>

      {/* Right: controls (30%) */}
      <div className="relative z-10 flex-[3] flex flex-col justify-between p-6 gap-4 bg-card/50 backdrop-blur-xl border-l border-border min-w-[280px]">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-display text-2xl text-foreground">Filtres</h3>
            <div className="w-12 h-px bg-primary/60 mx-auto mt-2" />
          </div>
          <div className="flex flex-col gap-3">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => !inSequence && setFilter(f.id)}
                disabled={inSequence}
                className={`w-full h-[64px] rounded-2xl font-display text-xl transition-all active:scale-95 backdrop-blur-md border-2 disabled:cursor-not-allowed ${
                  filter === f.id
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "bg-card/70 text-foreground border-border"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setScreen("countdown")}
          className="group relative animate-glow-pulse rounded-3xl bg-primary text-primary-foreground w-full h-[120px] font-display text-2xl font-semibold tracking-wide active:scale-95 transition-transform flex flex-col items-center justify-center gap-1"
        >
          <Camera size={32} />
          {inSequence ? `Photo ${currentShot}/${totalShots}` : "Prendre la photo"}
        </button>
      </div>
    </div>
  );
}
