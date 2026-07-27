import { useEffect, useRef, useState } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { takeSinglePhoto, saveFinal } from "@/services/api";
import { consumePendingCapture } from "@/services/captureQueue";
import { composeFinalImage } from "@/services/finalRender";
import PhotoFrame from "./PhotoFrame";
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
  const { settings } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"capturing" | "composing">("capturing");
  const [collected, setCollected] = useState<string[] | null>(null);
  const [finalSessionId, setFinalSessionId] = useState<string | undefined>(
    sessionId ?? undefined
  );
  const frameHostRef = useRef<HTMLDivElement>(null);

  // Step 1 — capture the next photo (or the first/only one).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pending = consumePendingCapture();
        const shot = await (pending ??
          takeSinglePhoto(filter, sessionId, {
            applyFrame: false,
            partOfGrid: mode === "four",
          }));
        if (cancelled) return;

        addCapturedPhoto(shot.photo, shot.sessionId);

        const total = mode === "four" ? 4 : 1;
        const doneCount = captureProgress + 1;

        if (doneCount < total) {
          setScreen("countdown");
          return;
        }

        setFinalSessionId(shot.sessionId);
        setCollected(photos.concat(shot.photo));
        setPhase("composing");
      } catch {
        if (!cancelled) setError("Erreur lors de la prise de photo. Veuillez réessayer.");
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2 — compose the final image on the tablet (WYSIWYG), then upload.
  useEffect(() => {
    if (phase !== "composing" || !collected) return;
    let cancelled = false;

    (async () => {
      try {
        // Give the offscreen frame a beat to mount + fonts to load.
        await (document as unknown as { fonts?: { ready: Promise<unknown> } })
          .fonts?.ready?.catch(() => {});
        await new Promise((r) => setTimeout(r, 150));

        const frameEl = settings.frameEnabled ? frameHostRef.current : null;
        const dataUrl = await composeFinalImage({
          photos: collected,
          frameEl,
          targetWidth: 1200,
          targetHeight: 1600,
        });

        let finalUrl = dataUrl;
        try {
          const saved = await saveFinal(dataUrl, finalSessionId);
          finalUrl = saved.url;
          if (saved.qrUrl) setQrUrl(saved.qrUrl);
        } catch {
          // Backend doesn't expose /save-final yet — degrade gracefully:
          // display the local dataURL. Client-side QR fallback in ResultScreen
          // will handle scanning display.
        }

        if (cancelled) return;
        setCaptureResult(finalSessionId ?? "", collected, finalUrl);
        setScreen("result");
      } catch (err) {
        console.error("[CaptureFlow] compose error", err);
        if (!cancelled) setError("Erreur lors de la création du montage final.");
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, collected]);

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
        {phase === "composing"
          ? "Création du montage final…"
          : mode === "four"
          ? `Capture de la photo ${currentShot}/${totalShots}…`
          : "Préparation de votre photo…"}
      </p>

      {/* Offscreen host for the frame used during composition. */}
      {phase === "composing" && settings.frameEnabled && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-99999px",
            top: 0,
            width: "900px",
            pointerEvents: "none",
            opacity: 1,
          }}
        >
          <div ref={frameHostRef}>
            <PhotoFrame variant="single">
              <div
                data-frame-photo-hole
                style={{
                  width: "100%",
                  aspectRatio: "3 / 4",
                  background: "#111",
                  borderRadius: 4,
                }}
              />
            </PhotoFrame>
          </div>
        </div>
      )}
    </div>
  );
}
