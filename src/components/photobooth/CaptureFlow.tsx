import { useEffect, useState } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { takePhoto } from "@/services/api";
import { Loader2 } from "lucide-react";

export default function CaptureFlow() {
  const { mode, filter, setScreen, setCaptureResult, addCapturedPhoto, captureProgress, photos } = usePhotobooth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function capture() {
      try {
        // Always call backend with mode "single" for real capture
        const result = await takePhoto("single", filter);
        if (cancelled) return;

        if (mode === "four") {
          // Accumulate this photo
          addCapturedPhoto(result.finalImage, result.sessionId);

          const photosAfter = captureProgress + 1; // will be after addCapturedPhoto
          if (photosAfter < 4) {
            // Go back to countdown for the next shot
            setScreen("countdown");
          } else {
            // All 4 done — go to result
            // We set the full result with all accumulated photos + this one
            const allPhotos = [...photos, result.finalImage];
            setCaptureResult(result.sessionId, allPhotos, result.finalImage);
            setScreen("result");
          }
        } else {
          // Single mode — same as before
          setCaptureResult(result.sessionId, result.photos, result.finalImage);
          setScreen("result");
        }
      } catch (err) {
        if (!cancelled) {
          setError("Erreur lors de la prise de photo. Veuillez réessayer.");
        }
      }
    }

    capture();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {mode === "four"
          ? `Capture photo ${captureProgress + 1} sur 4…`
          : "Préparation de votre photo…"}
      </p>
    </div>
  );
}
