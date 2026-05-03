import { useState, useEffect } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { useSettings } from "@/contexts/SettingsContext";
import { sendEmail, printPhoto } from "@/services/api";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/button";
import { Mail, QrCode, RotateCcw, ArrowLeft, CheckCircle, AlertCircle, Printer } from "lucide-react";
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
  const { mode, photos, finalImage, qrUrl, setScreen } = usePhotobooth();
  const { settings } = useSettings();
  const { playSuccess } = useSound();

  const [panel, setPanel] = useState<Panel>("none");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendErrorMessage, setSendErrorMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [printStatus, setPrintStatus] = useState<"idle" | "printing" | "sent" | "error">("idle");
  const [printMessage, setPrintMessage] = useState("");

  useEffect(() => {
    playSuccess();
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

  const photoContent = mode === "four" ? (
    <div className="grid grid-cols-2 gap-2">
      {photos.map((photo, i) => (
        <div key={i} className="rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center">
          <img src={photo} alt={`Photo ${i + 1}`} className="max-w-full max-h-full object-contain" />
        </div>
      ))}
    </div>
  ) : (
    <div className="rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center">
      <img src={finalImage || photos[0]} alt="Votre photo" className="max-w-full max-h-full object-contain" />
    </div>
  );

  // QR panel
  if (panel === "qr") {
    return (
      <div className="flex h-screen w-full items-center justify-center px-10 py-8 animate-float-in gap-12">
        <button
          onClick={() => setPanel("none")}
          className="absolute top-6 left-6 flex items-center gap-2 px-5 h-[56px] rounded-full bg-card/70 backdrop-blur-md border-2 border-border text-foreground active:scale-95"
        >
          <ArrowLeft size={20} />
          <span className="font-body text-base">Retour</span>
        </button>

        <div className="w-[420px] h-[420px] max-w-[60vh] max-h-[60vh] rounded-3xl border-2 border-primary/40 bg-white flex items-center justify-center shadow-glow p-4">
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" className="w-full h-full rounded-lg object-contain" />
          ) : (
            <div className="text-muted-foreground/40 text-base">QR code indisponible</div>
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

  // Email panel
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

  // Main result screen — landscape: photo left, actions right
  return (
    <div className="flex h-screen w-full animate-float-in">
      {/* Left: photo */}
      <div className="flex-[6] flex flex-col items-center justify-center p-8 min-w-0">
        <div className="text-center mb-6">
          <h2 className="font-display text-5xl text-foreground text-glow-yellow">Magnifique !</h2>
          <p className="text-lg text-muted-foreground mt-2">Votre souvenir est prêt</p>
        </div>
        <div className="animate-photo-reveal flex-1 flex items-center justify-center min-h-0 w-full">
          <div className="h-full max-h-full max-w-full flex items-center justify-center">
            <div className="max-h-full">
              {settings.frameEnabled ? (
                <PhotoFrame variant={mode === "four" ? "strip" : "single"}>
                  {photoContent}
                </PhotoFrame>
              ) : (
                <div className="bg-card border-2 border-primary/30 rounded-2xl p-3 shadow-glow max-w-[420px]">
                  {photoContent}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex-[4] flex flex-col justify-center gap-4 p-8 bg-card/50 backdrop-blur-xl border-l border-border min-w-[320px]">
        <Button variant="hero" size="lg" onClick={() => setPanel("email")}>
          <Mail />
          Envoyer par e-mail
        </Button>
        {qrUrl && (
          <Button variant="elegant" size="lg" onClick={() => setPanel("qr")}>
            <QrCode />
            Afficher le QR code
          </Button>
        )}
        <Button
          variant="elegant"
          size="lg"
          onClick={handlePrint}
          disabled={printStatus === "printing"}
        >
          <Printer />
          {printStatus === "printing" ? "Impression..." : "Imprimer"}
        </Button>
        {printMessage && printStatus !== "printing" && (
          <p
            className={`text-base text-center flex items-center justify-center gap-2 ${
              printStatus === "error" ? "text-destructive" : "text-accent-foreground"
            }`}
          >
            {printStatus === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {printMessage}
          </p>
        )}
        <Button variant="ghost" size="lg" onClick={handleRestart} className="text-muted-foreground mt-2">
          <RotateCcw />
          Recommencer
        </Button>
      </div>
    </div>
  );
}
