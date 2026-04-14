import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PhotoFilter } from "@/services/api";

const filters: { id: PhotoFilter; label: string; style: string }[] = [
  { id: "none", label: "Sans filtre", style: "" },
  { id: "bw", label: "Noir & blanc", style: "grayscale(100%)" },
  { id: "sepia", label: "Sépia", style: "sepia(80%)" },
];

export default function FilterSelection() {
  const { setFilter, setScreen, filter } = usePhotobooth();

  const select = (f: PhotoFilter) => {
    setFilter(f);
    setScreen("countdown");
  };

  return (
    <div className="flex flex-col min-h-screen px-8 py-10">
      <button
        onClick={() => setScreen("mode")}
        className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        <span className="font-body text-sm">Retour</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 animate-float-in">
        <div className="text-center space-y-2">
          <h2 className="font-display text-4xl text-foreground">
            Choisissez un filtre
          </h2>
          <div className="w-12 h-px bg-primary/40 mx-auto" />
        </div>

        <div className="grid grid-cols-1 gap-5 w-full max-w-xs">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => select(f.id)}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 active:scale-[0.97] ${
                filter === f.id
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {/* Preview image with filter */}
              <div
                className="h-32 bg-gradient-to-br from-champagne to-blush"
                style={{ filter: f.style || undefined }}
              >
                <div className="h-full flex items-center justify-center">
                  <div className="w-12 h-16 rounded-lg bg-foreground/10" />
                </div>
              </div>
              <div className="p-4 bg-card">
                <p className="font-display text-xl text-foreground text-center">
                  {f.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
