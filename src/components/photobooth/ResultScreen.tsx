import { useState, useEffect } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { sendEmail } from "@/services/api";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/button";
import { Mail, QrCode, RotateCcw, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import PhotoFrame from "./PhotoFrame";
import VirtualKeyboard from "./VirtualKeyboard";

type Panel = "none" | "qr" | "email";

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

export default function ResultScreen() {
  const { mode, photos, finalImage, qrUrl, restart } = usePhotobooth();
  const { settings } = useSettings();
  const { playSuccess } = useSound();

  const [panel, setPanel] = useState<Panel>("none");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendErrorMessage, setSendErrorMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleRestart = () => {
    setPanel("none");
    restart();
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

  const photoContent = mode === "four" ? (
    <div className="grid grid-cols-2 gap-2">
      {photos.map((photo, i) => (
        <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
          <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  ) : (
    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted max-w-[300px]">
      <img src={finalImage || photos[0]} alt="Votre photo" className="w-full h-full object-cover" />
    </div>
  );

  // QR panel
  if (panel === "qr") {
    return (
      <div className="flex flex-col min-h-screen px-6 py-8 animate-float-in">
        <button
          onClick={() => setPanel("none")}
          className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span className="font-body text-sm">Retour</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <h2 className="font-display text-3xl text-foreground">QR Code</h2>
          <div className="w-10 h-px bg-primary/40 mx-auto" />

          <div className="w-56 h-56 rounded-2xl border-2 border-border bg-card flex items-center justify-center shadow-md">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
            ) : (
              <div className="text-muted-foreground/40 text-sm">QR code indisponible</div>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Scannez pour télécharger votre photo
          </p>

          <AutoRedirectCountdown seconds={30} onComplete={() => setPanel("none")} />
        </div>
      </div>
    );
  }

  // Email panel
  if (panel === "email") {
    return (
      <div className="flex flex-col min-h-screen px-4 py-6 animate-float-in">
        <button
          onClick={() => setPanel("none")}
          className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="font-body text-sm">Retour</span>
        </button>

        <div className="flex flex-col items-center gap-4 flex-1">
          <div className="text-center space-y-1">
            <h2 className="font-display text-3xl text-foreground">Recevoir votre photo</h2>
            <div className="w-10 h-px bg-primary/40 mx-auto" />
          </div>

          {emailStatus === "sent" ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-float-up">
              <CheckCircle size={48} className="text-accent-foreground" />
              <p className="font-display text-xl text-foreground text-center">Photo envoyée !</p>
              <p className="text-sm text-muted-foreground">{email}</p>
              <AutoRedirectCountdown seconds={10} onComplete={handleRestart} />
            </div>
          ) : (
            <>
              <div className="w-full max-w-md">
                <div className="w-full h-14 rounded-xl border-2 border-primary/30 bg-card px-5 flex items-center text-lg font-body text-foreground">
                  {email ? (
                    <span>{email}<span className="animate-pulse text-primary">|</span></span>
                  ) : (
                    <span className="text-muted-foreground/50">votre@email.com</span>
                  )}
                </div>
                {emailError && (
                  <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {emailError}
                  </p>
                )}
                {emailStatus === "error" && (
                  <p className="text-destructive text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Erreur lors de l'envoi. Veuillez réessayer.
                  </p>
                )}
              </div>

              <div className="w-full max-w-md mt-2">
                <VirtualKeyboard
                  value={email}
                  onChange={(v) => { setEmail(v); setEmailError(""); }}
                  onSubmit={handleSend}
                  submitDisabled={emailStatus === "sending" || !email}
                />
              </div>

              {emailStatus === "sending" && (
                <p className="text-muted-foreground font-body animate-pulse mt-2">Envoi en cours…</p>
              )}

              <button onClick={handleRestart} className="text-sm text-muted-foreground/60 mt-2 flex items-center gap-1.5">
                <RotateCcw size={14} />
                Recommencer
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main result screen
  return (
    <div className="flex flex-col min-h-screen px-6 py-8 animate-float-in">
      <div className="text-center mb-6">
        <h2 className="font-display text-3xl text-foreground">Votre photo</h2>
        <div className="w-10 h-px bg-primary/40 mx-auto mt-2" />
      </div>

      <div className="flex-1 flex items-center justify-center mb-8">
        {settings.frameEnabled ? (
          <PhotoFrame variant={mode === "four" ? "strip" : "single"}>
            {photoContent}
          </PhotoFrame>
        ) : (
          <div className="bg-card border-2 border-border rounded-2xl p-3 shadow-xl">
            {photoContent}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto w-full">
        <Button variant="hero" size="lg" onClick={() => setPanel("email")}>
          <Mail size={20} />
          Envoyer par e-mail
        </Button>
        {qrUrl && (
          <Button variant="elegant" size="lg" onClick={() => setPanel("qr")}>
            <QrCode size={20} />
            Afficher le QR code
          </Button>
        )}
        <Button variant="ghost" size="lg" onClick={handleRestart} className="text-muted-foreground">
          <RotateCcw size={18} />
          Recommencer
        </Button>
      </div>
    </div>
  );
}
