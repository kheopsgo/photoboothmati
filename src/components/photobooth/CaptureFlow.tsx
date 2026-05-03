import { useEffect, useState } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { createGrid, takeSinglePhoto } from "@/services/api";
import { consumePendingCapture } from "@/services/captureQueue";
import { Loader2 } from "lucide-react";

export default function CaptureFlow() {
  const {
    mode,
    filter,
    sessionId,
    photos,
    captureProgress,
    setScreen,
    setCaptureResult,
    addCapturedPhoto,
    setQrUrl,
  } = usePhotobooth();
  const [error, setError] = useState<string | null>(null);
  const [assembling, setAssembling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 1) Capture a single photo (reuse early-fired promise if any).
        const pending = consumePendingCapture();
        const shot = await (pending ?? takeSinglePhoto(filter, sessionId, {
          applyFrame: mode !== "four",
          partOfGrid: mode === "four",
        }));
        if (cancelled) return;

        const newPhotos = [...photos, shot.photo];
        addCapturedPhoto(shot.photo, shot.sessionId);

        // 2) Decide what's next.
        if (mode === "four") {
          if (newPhotos.length < 4) {
            // Back to live preview for the next shot.
            setScreen("preview");
            return;
          }

          // 4 photos captured — ask backend to assemble the 2x2 grid.
          setAssembling(true);
          const result = await createGrid(newPhotos, filter, shot.sessionId);
          if (cancelled) return;
          if (result.qrUrl) setQrUrl(result.qrUrl);
          setCaptureResult(result.sessionId, result.photos, result.finalImage);
          setScreen("result");
        } else {
          // Single mode: the captured photo IS the final image.
          setCaptureResult(shot.sessionId, [shot.photo], shot.photo);
          setScreen("result");
        }
      } catch (err) {
        if (!cancelled) {
          setError("Erreur lors de la prise de photo. Veuillez réessayer.");
        }
      }
    }

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-8 gap-6">
        <p className="text-destructive font-body text-center text-lg">{error}</p>
        <button
          onClick={() => setScreen(mode === "four" && photos.length > 0 ? "preview" : "countdown")}
          className="font-display text-xl text-primary underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const totalShots = mode === "four" ? 4 : 1;
  const currentShot = Math.min(captureProgress + 1, totalShots);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 animate-float-in">
      <Loader2 size={48} className="text-primary animate-spin" />
      <p className="font-display text-2xl text-muted-foreground text-center px-6">
        {assembling
          ? "Création du montage final…"
          : mode === "four"
          ? `Capture de la photo ${currentShot}/${totalShots}…`
          : "Préparation de votre photo…"}
      </p>
    </div>
  );
}
