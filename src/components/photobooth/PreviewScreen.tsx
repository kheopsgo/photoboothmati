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
      {/* Fullscreen blurred background */}
      <div className="absolute inset-0 z-0">
        <img
          src={streamUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl brightness-50"
          style={{ transform: "scaleX(-1) scale(1.1)" }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/90 pointer-events-none" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8">
        <button
          onClick={() => setScreen("mode")}
          className="flex items-center gap-3 px-6 h-[72px] rounded-full bg-card/70 backdrop-blur-md border-2 border-border text-foreground active:scale-95 active:border-primary transition-all disabled:opacity-50"
          disabled={inSequence}
        >
          <ArrowLeft size={26} />
          <span className="font-display text-xl">Retour</span>
        </button>

        {mode === "four" && (
          <div className="px-7 h-[72px] flex items-center rounded-full bg-primary/20 backdrop-blur-md border-2 border-primary/50">
            <span className="font-display text-2xl text-primary font-semibold">
              Photo {currentShot}/{totalShots}
            </span>
          </div>
        )}
        <div className="w-[140px]" />
      </div>

      {/* Live camera — large vertical area */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-6 min-h-0">
        <div className="relative w-full h-full max-w-[820px] flex items-center justify-center">
          <img
            src={streamUrl}
            alt="Aperçu caméra en direct"
            className="max-h-full max-w-full h-auto w-auto object-contain rounded-3xl shadow-2xl ring-2 ring-primary/30"
            style={{ transform: "scaleX(-1)", filter: currentCss }}
            loading="eager"
          />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-8 space-y-5">
        {/* Filter pills — large touch targets */}
        <div className="flex justify-center gap-3 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => !inSequence && setFilter(f.id)}
              disabled={inSequence}
              className={`px-6 h-[72px] min-w-[150px] rounded-full font-display text-xl transition-all active:scale-95 backdrop-blur-md border-2 disabled:cursor-not-allowed ${
                filter === f.id
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "bg-card/70 text-foreground border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Big capture CTA — thumb-friendly */}
        <div className="flex justify-center pt-1">
          <button
            onClick={() => setScreen("countdown")}
            className="group relative animate-glow-pulse rounded-full bg-primary text-primary-foreground px-12 h-[96px] font-display text-3xl font-semibold tracking-wide active:scale-95 transition-transform flex items-center gap-3"
          >
            <Camera size={32} />
            {inSequence ? `Prendre la photo ${currentShot}/${totalShots}` : "Prendre la photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
