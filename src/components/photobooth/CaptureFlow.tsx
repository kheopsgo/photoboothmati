import { useEffect, useRef, useState } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { createGrid, takeSinglePhoto } from "@/services/api";
import { consumePendingCapture } from "@/services/captureQueue";
import { getSavedFrameHole } from "@/services/collage";
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
  // Garde anti double-montage (StrictMode / remount Chromium)
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    async function run() {
      try {
        const pending = consumePendingCapture();
        const shot = await (pending ?? takeSinglePhoto(filter, sessionId, {
          applyFrame: mode !== "four",
          partOfGrid: mode === "four",
        }));
        if (cancelled) return;

        addCapturedPhoto(shot.photo, shot.sessionId);

        if (mode === "four") {
          const nextCount = captureProgress + 1;
          if (nextCount < 4) {
            setScreen("countdown");
            return;
          }

          // Le backend est l'unique source de vérité pour le montage 2x2.
          setAssembling(true);
          const allPhotos = photos.concat(shot.photo);
          const result = await createGrid(allPhotos, filter, shot.sessionId, getSavedFrameHole());
          if (cancelled) return;

          const finalImg = result.finalImage || allPhotos[0];
          const finalPhotos = result.photos && result.photos.length ? result.photos : allPhotos;
          setCaptureResult(result.sessionId || shot.sessionId, finalPhotos, finalImg);
          if (result.qrUrl) setQrUrl(result.qrUrl);
          setScreen("result");
        } else {
          setCaptureResult(shot.sessionId, [shot.photo], shot.photo);
          setScreen("result");
        }
      } catch (err) {
        if (!cancelled) {
          setAssembling(false);
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
          onClick={() => setScreen("countdown")}
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
          ? "Création de votre montage…"
          : mode === "four"
            ? `Capture de la photo ${currentShot}/${totalShots}…`
            : "Préparation de votre photo…"}
      </p>

    </div>
  );
}
