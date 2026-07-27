import { useState, useEffect, useMemo } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useBackendHealth } from "@/contexts/BackendHealthContext";
import { sendEmail, printPhoto } from "@/services/api";
import { useSound } from "@/hooks/useSound";
import { hapticSuccess, hapticLight } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { Mail, QrCode, ArrowLeft, CheckCircle, AlertCircle, Printer, Camera, Share2 } from "lucide-react";
import VirtualKeyboard from "./VirtualKeyboard";
import RotatedPortraitImage from "./RotatedPortraitImage";
import QRCode from "qrcode";

type Panel = "none" | "qr" | "email" | "printed" | "share";

const HOME_TIMEOUT_S = 60;
const PRINT_CONFIRM_S = 8;

function AutoRedirectCountdown({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onComplete(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onComplete]);

  return (
    <div className="text-center space-y-2 mt-4">
      <p className="text-sm text-muted-foreground">
        Retour à l'accueil dans <span className="font-semibold text-foreground">{remaining}s</span>
      </p>
      <div className="w-48 h-1.5 rounded-full bg-border mx-auto overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(remaining / seconds) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: 2.5 + Math.random() * 2.5,
        size: 6 + Math.random() * 10,
        rotate: Math.random() * 360,
        hue: Math.random() > 0.5 ? "hsl(48 100% 60%)" : "hsl(45 30% 96%)",
        key: i,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-40">
      {pieces.map((p) => (
        <span
          key={p.key}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.hue,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            borderRadius: 2,
            boxShadow: `0 0 8px ${p.hue}`,
          }}
        />
      ))}
    </div>
  );
}

export default function ResultScreen() {
  const { mode, photos, finalImage, qrUrl, setScreen } = usePhotobooth();
  const { settings } = useSettings();
  const { online } = useBackendHealth();
  const { playSuccess } = useSound({ enabled: settings.soundsEnabled });
  const [fallbackQr, setFallbackQr] = useState<string | null>(null);
  const effectiveQr = qrUrl || fallbackQr;

  useEffect(() => {
    if (qrUrl || !finalImage) return;
    let cancelled = false;
    QRCode.toDataURL(finalImage, { width: 512, margin: 1 })
      .then((url) => { if (!cancelled) setFallbackQr(url); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [qrUrl, finalImage]);

  const [panel, setPanel] = useState<Panel>("none");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendErrorMessage, setSendErrorMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [printStatus, setPrintStatus] = useState<"idle" | "printing" | "sent" | "error">("idle");
  const [printMessage, setPrintMessage] = useState("");

  useEffect(() => {
    playSuccess();
    hapticSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestart = () => {
    setPanel("none");
    setScreen("thanks");
  };

  const handlePrint = async () => {
    const imageToPrint = finalImage || photos[0];
    if (!imageToPrint || printStatus === "printing") return;
    setPrintStatus("printing");
    setPrintMessage("Impression en cours...");
    try {
      await printPhoto(imageToPrint);
      setPrintStatus("sent");
      setPrintMessage("Impression lancée !");
      setPanel("printed");
    } catch {
      setPrintStatus("error");
      setPrintMessage("Erreur lors de l'impression");
    }
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSend = async () => {
    if (!validateEmail(email)) {
      setEmailError("Veuillez entrer une adresse e-mail valide");
      return;
    }
    setEmailError("");
    setSendErrorMessage("");
    setEmailStatus("sending");
    try {
      const imageToSend = finalImage || photos[0];
      if (!imageToSend) throw new Error("Aucune image à envoyer");
      await sendEmail(email, imageToSend);
      setEmailStatus("sent");
      playSuccess();
    } catch (err) {
      setSendErrorMessage(
        err instanceof Error && err.message ? err.message : "Erreur lors de l'envoi de l'e-mail"
      );
      setEmailStatus("error");
    }
  };

  const handleNativeShare = async () => {
    const imageToShare = finalImage || photos[0];
    if (!imageToShare) return;
    hapticLight();
    try {
      if (navigator.share) {
        await navigator.share({
          title: settings.eventConfig.title || "Photobooth",
          text: settings.eventConfig.footer || "Votre souvenir du photobooth",
          url: imageToShare,
        });
      } else {
        setPanel("qr");
      }
    } catch {
      // User cancelled or share failed
    }
  };

  const resultImageSrc = finalImage || photos[0];
  const watermark = settings.showEventWatermark
    ? `${settings.eventConfig.title}${settings.eventConfig.subtitle ? ` — ${settings.eventConfig.subtitle}` : ""}`
    : "";

  const photoContent = resultImageSrc ? (
    <div className="relative h-full w-full flex items-center justify-center">
      <RotatedPortraitImage
        src={resultImageSrc}
        alt="Votre photo"
        className="h-full max-h-full w-auto aspect-[3/4] rounded-xl animate-polaroid-reveal"
      />
      {watermark && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-background/70 backdrop-blur-md border border-primary/20">
          <p className="font-body text-xs text-foreground/80 whitespace-nowrap">{watermark}</p>
        </div>
      )}
    </div>
  ) : mode === "four" ? (
    <div className="grid h-full max-h-full max-w-full aspect-square grid-cols-2 grid-rows-2 gap-2">
      {photos.map((photo, i) => (
        <div key={i} className="flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-lg bg-muted/40">
          <RotatedPortraitImage
            src={photo}
            alt={`Photo ${i + 1}`}
            className="h-full max-h-full w-auto aspect-[3/4] rounded-lg"
          />
        </div>
      ))}
    </div>
  ) : null;

  if (panel === "qr") {
    return (
      <div className="flex h-screen w-full items-center justify-center px-10 py-8 animate-float-in gap-12">
        <button
          onClick={() => setPanel("none")}
          className="absolute top-6 left-6 flex items-center gap-2 px-5 h-[56px] rounded-full bg-card/70 backdrop-blur-md border-2 border-border text-foreground active:scale-95 z-10"
        >
          <ArrowLeft size={20} />
          <span className="font-body text-base">Retour</span>
        </button>

        <div className="w-[420px] h-[420px] max-w-[60vh] max-h-[60vh] rounded-3xl border-2 border-primary/40 bg-white flex items-center justify-center shadow-glow p-4">
          {effectiveQr ? (
            <img src={effectiveQr} alt="QR Code" className="w-full h-full rounded-lg object-contain" />
          ) : (
            <div className="text-muted-foreground/40 text-base">Génération du QR code…</div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 max-w-sm">
          <h2 className="font-display text-5xl text-foreground">QR Code</h2>
          <div className="w-16 h-px bg-primary/40" />
          <p className="text-xl text-muted-foreground text-center">
            Scannez pour télécharger votre photo
          </p>
          <AutoRedirectCountdown seconds={30} onComplete={() => setPanel("none")} />
        </div>
      </div>
    );
  }

  if (panel === "email") {
    return (
      <div className="flex h-screen w-full px-8 py-6 animate-float-in gap-8 items-center">
        <button
          onClick={() => setPanel("none")}
          className="absolute top-6 left-6 flex items-center gap-2 px-5 h-[56px] rounded-full bg-card/70 backdrop-blur-md border-2 border-border text-foreground active:scale-95 z-10"
        >
          <ArrowLeft size={20} />
          <span className="font-body text-base">Retour</span>
        </button>

        {emailStatus === "sent" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-float-up">
            <CheckCircle size={64} className="text-accent-foreground" />
            <p className="font-display text-3xl text-foreground text-center">Photo envoyée !</p>
            <p className="text-lg text-muted-foreground">{email}</p>
            <AutoRedirectCountdown seconds={10} onComplete={handleRestart} />
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center gap-5 max-w-md">
              <div className="text-center space-y-1">
                <h2 className="font-display text-3xl text-foreground">Recevoir votre photo</h2>
                <div className="w-12 h-px bg-primary/40 mx-auto" />
              </div>
              <div className="w-full">
                <div className="w-full h-16 rounded-xl border-2 border-primary/30 bg-card px-5 flex items-center text-xl font-body text-foreground">
                  {email ? (
                    <span>{email}<span className="animate-pulse text-primary">|</span></span>
                  ) : (
                    <span className="text-muted-foreground/50">votre@email.com</span>
                  )}
                </div>
                {emailError && (
                  <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />{emailError}
                  </p>
                )}
                {emailStatus === "error" && (
                  <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {sendErrorMessage || "Erreur lors de l'envoi de l'e-mail"}
                  </p>
                )}
              </div>
              {emailStatus === "sending" && (
                <p className="text-muted-foreground font-body animate-pulse">Envoi en cours…</p>
              )}
            </div>

            <div className="flex-1 max-w-2xl">
              <VirtualKeyboard
                value={email}
                onChange={(v) => { setEmail(v); setEmailError(""); }}
                onSubmit={handleSend}
                submitDisabled={emailStatus === "sending" || !email}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  if (panel === "printed") {
    return (
      <div className="flex h-screen w-full items-center justify-center px-10 py-8 animate-float-in">
        <div className="flex flex-col items-center gap-5 max-w-md text-center">
          <CheckCircle size={88} className="text-accent-foreground" />
          <h2 className="font-display text-5xl text-foreground">Impression lancée !</h2>
          <p className="text-lg text-muted-foreground">
            Récupérez votre photo près de l'imprimante.
          </p>
          <AutoRedirectCountdown seconds={PRINT_CONFIRM_S} onComplete={handleRestart} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-screen animate-float-in overflow-hidden bg-background">
      <Confetti />

      <div className="flex h-full min-h-0 min-w-0 basis-[72%] items-center justify-center overflow-hidden p-3">
        <div className="flex h-full max-h-full w-full max-w-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-primary/25 bg-card/70 p-3 shadow-glow">
          {photoContent}
        </div>
      </div>

      <div className="flex h-full min-h-0 min-w-[280px] basis-[28%] flex-col justify-center gap-3 overflow-hidden border-l border-border bg-card/50 p-5 backdrop-blur-xl">
        <div className="mb-2 shrink-0 text-center">
          <h2 className="font-display text-3xl text-foreground text-glow-yellow">Magnifique !</h2>
          <p className="text-sm text-muted-foreground">Votre souvenir est prêt</p>
        </div>

        <Button variant="hero" size="lg" onClick={handleRestart}>
          <Camera />
          Nouvelle photo
        </Button>

        {qrUrl && (
          <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-primary/20 shadow-glow">
            <img src={qrUrl} alt="QR Code" className="w-32 h-32 object-contain" />
            <p className="text-xs text-muted-foreground font-body">Scannez pour télécharger</p>
          </div>
        )}

        <Button variant="elegant" size="lg" onClick={handleNativeShare}>
          <Share2 />
          Partager
        </Button>

        <Button variant="elegant" size="lg" onClick={() => setPanel("email")} disabled={!online}>
          <Mail />
          Email
        </Button>

        <Button
          variant="elegant"
          size="lg"
          onClick={handlePrint}
          disabled={printStatus === "printing" || !online}
        >
          <Printer />
          {printStatus === "printing" ? "Impression..." : "Imprimer"}
        </Button>

        {printStatus === "error" && printMessage && (
          <p className="text-base text-center flex items-center justify-center gap-2 text-destructive">
            <AlertCircle size={18} />
            {printMessage}
          </p>
        )}

        <AutoRedirectCountdown seconds={HOME_TIMEOUT_S} onComplete={handleRestart} />
      </div>
    </div>
  );
}
