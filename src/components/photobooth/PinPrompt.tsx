import { useState } from "react";
import { Lock, X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export default function PinPrompt({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { settings } = useSettings();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const append = (d: string) => {
    if (pin.length >= 8) return;
    setError(false);
    const next = pin + d;
    setPin(next);
  };

  const submit = () => {
    if (pin === settings.adminPin) {
      onSuccess();
    } else {
      setError(true);
      setPin("");
    }
  };

  const clear = () => {
    setPin("");
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm">
      <div className="relative bg-background rounded-3xl shadow-2xl p-8 w-[420px] max-w-[90vw]">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
          aria-label="Fermer"
        >
          <X size={18} className="text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock size={24} className="text-primary" />
          </div>
          <h2 className="font-display text-2xl text-foreground">Accès admin</h2>
          <p className="text-sm text-muted-foreground">Saisissez le code PIN</p>
        </div>

        <div className="flex justify-center gap-3 mb-6 h-12 items-center">
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 ${
                i < pin.length
                  ? error
                    ? "bg-destructive border-destructive"
                    : "bg-primary border-primary"
                  : "border-muted-foreground/40"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-destructive text-sm mb-4">Code incorrect</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => append(d)}
              className="h-16 rounded-xl bg-muted hover:bg-muted/70 active:scale-95 transition text-2xl font-display text-foreground"
            >
              {d}
            </button>
          ))}
          <button
            onClick={clear}
            className="h-16 rounded-xl bg-muted hover:bg-muted/70 active:scale-95 transition text-sm text-muted-foreground"
          >
            Effacer
          </button>
          <button
            onClick={() => append("0")}
            className="h-16 rounded-xl bg-muted hover:bg-muted/70 active:scale-95 transition text-2xl font-display text-foreground"
          >
            0
          </button>
          <button
            onClick={submit}
            disabled={pin.length === 0}
            className="h-16 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition text-sm font-display disabled:opacity-50"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
