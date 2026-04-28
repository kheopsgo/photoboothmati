import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { API_BASE } from "@/services/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera } from "lucide-react";
import type { PhotoFilter } from "@/services/api";

const filters: { id: PhotoFilter; label: string; cssFilter: string }[] = [
  { id: "none", label: "Sans filtre", cssFilter: "none" },
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
    <div className="flex flex-col min-h-screen px-6 py-6 gap-5">
      <button
        onClick={() => setScreen("mode")}
        className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        disabled={inSequence}
      >
        <ArrowLeft size={20} />
        <span className="font-body text-sm">Retour</span>
      </button>

      <div className="text-center space-y-2 animate-float-in">
        <h2 className="font-display text-3xl text-foreground">
          {inSequence ? "Préparez-vous" : "Aperçu en direct"}
        </h2>
        {mode === "four" && (
          <p className="font-display text-base text-primary">
            Photo {currentShot}/{totalShots}
          </p>
        )}
        <div className="w-12 h-px bg-primary/40 mx-auto" />
      </div>

      {/* Live preview */}
      <div className="relative w-full overflow-hidden rounded-2xl border-2 border-border bg-black/80 aspect-[3/4] max-h-[55vh] mx-auto">
        <img
          src={streamUrl}
          alt="Aperçu caméra en direct"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: "scaleX(-1)", filter: currentCss }}
          loading="eager"
        />
      </div>

      {/* Filter selector */}
      <div className="space-y-3">
        <p className="text-center font-display text-lg text-muted-foreground">
          Choisissez un filtre
        </p>
        <div className="grid grid-cols-3 gap-3">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-xl border-2 px-3 py-3 transition-all active:scale-[0.97] ${
                filter === f.id
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <p className="font-display text-sm text-foreground">{f.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <Button
          variant="hero"
          size="touch"
          onClick={() => setScreen("countdown")}
          className="gap-2"
        >
          <Camera size={20} />
          Prendre la photo
        </Button>
      </div>
    </div>
  );
}
