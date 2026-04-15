import { useEffect, useState } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { takePhoto, getLatestPhoto } from "@/services/api";
import { Loader2 } from "lucide-react";

export default function CaptureFlow() {
  const { mode, filter, setScreen, setCaptureResult, setQrUrl } = usePhotobooth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function capture() {
      try {
        const result = await takePhoto(mode!, filter);
        if (cancelled) return;

        setCaptureResult(result.sessionId, result.photos, result.finalImage);

        // Fetch QR
        try {
          const latest = await getLatestPhoto(result.sessionId);
          if (!cancelled) setQrUrl(latest.qrUrl);
        } catch {
          // QR not critical
        }

        if (!cancelled) setScreen("result");
      } catch (err) {
        if (!cancelled) {
          setError("Erreur lors de la prise de photo. Veuillez réessayer.");
        }
      }
    }

    capture();
    return () => { cancelled = true; };
  }, [mode, filter, setCaptureResult, setQrUrl, setScreen]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 gap-6">
        <p className="text-destructive font-body text-center text-lg">{error}</p>
        <button
          onClick={() => setScreen("countdown")}
          className="font-display text-xl text-primary underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 animate-float-in">
      <Loader2 size={48} className="text-primary animate-spin" />
      <p className="font-display text-2xl text-muted-foreground">
        Préparation de votre photo…
      </p>
    </div>
  );
}
