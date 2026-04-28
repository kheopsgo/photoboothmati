import { usePhotobooth } from "@/contexts/PhotoboothContext";
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
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-background">
      {/* Fullscreen live camera */}
      <div className="absolute inset-0 z-0">
        <img
          src={streamUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl brightness-50"
          style={{ transform: "scaleX(-1) scale(1.1)" }}
          loading="eager"
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <img
            src={streamUrl}
            alt="Aperçu caméra en direct"
            className="max-h-full max-w-full h-auto w-auto object-contain rounded-2xl shadow-2xl ring-1 ring-primary/20"
            style={{ transform: "scaleX(-1)", filter: currentCss }}
            loading="eager"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80 pointer-events-none" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        <button
          onClick={() => setScreen("mode")}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/70 backdrop-blur-md border border-border text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
          disabled={inSequence}
        >
          <ArrowLeft size={18} />
          <span className="font-body text-sm">Retour</span>
        </button>

        {mode === "four" && (
          <div className="px-5 py-2 rounded-full bg-primary/15 backdrop-blur-md border border-primary/40">
            <span className="font-display text-base text-primary font-semibold">
              Photo {currentShot}/{totalShots}
            </span>
          </div>
        )}
        <div className="w-[88px]" />
      </div>

      {/* Spacer pushes controls to bottom */}
      <div className="flex-1" />

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-8 space-y-5">
        {/* Filter pills */}
        <div className="flex justify-center gap-3 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => !inSequence && setFilter(f.id)}
              disabled={inSequence}
              className={`px-5 py-3 rounded-full font-display text-base transition-all active:scale-95 backdrop-blur-md border-2 disabled:cursor-not-allowed ${
                filter === f.id
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "bg-card/70 text-foreground border-border hover:border-primary/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Big capture CTA */}
        <div className="flex justify-center">
          <button
            onClick={() => setScreen("countdown")}
            className="group relative animate-glow-pulse rounded-full bg-primary text-primary-foreground px-12 py-6 font-display text-2xl font-semibold tracking-wide active:scale-95 transition-transform flex items-center gap-3"
          >
            <Camera size={26} />
            {inSequence ? `Prendre la photo ${currentShot}/${totalShots}` : "Prendre la photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
