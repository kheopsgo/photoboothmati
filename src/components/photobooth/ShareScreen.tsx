import { useState, useEffect, useRef } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { sendEmail } from "@/services/api";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, AlertCircle, RotateCcw, QrCode } from "lucide-react";
import VirtualKeyboard from "./VirtualKeyboard";

function AutoRedirectCountdown({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) { onComplete(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onComplete]);

  return (
    <div className="text-center space-y-3 mt-4">
      <p className="text-sm text-muted-foreground">
        Retour à l'accueil dans <span className="font-semibold text-foreground">{remaining}s</span>
      </p>
      <div className="w-48 h-1.5 rounded-full bg-border mx-auto overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(remaining / seconds) * 100}%` }}
        />
      </div>
      <button onClick={onComplete} className="text-sm text-muted-foreground/60 flex items-center gap-1.5 mx-auto mt-2">
        <RotateCcw size={14} />
        Recommencer maintenant
      </button>
    </div>
  );
}

function SuccessAutoRedirect({ restart, message, detail }: { restart: () => void; message: string; detail?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-float-up">
      <CheckCircle size={48} className="text-accent-foreground" />
      <p className="font-display text-xl text-foreground text-center">{message}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      <AutoRedirectCountdown seconds={10} onComplete={restart} />
    </div>
  );
}

export default function ShareScreen() {
  const { sessionId, qrUrl, emailStatus, setEmailStatus, setScreen, restart } = usePhotobooth();
  const { playSuccess } = useSound();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showQr, setShowQr] = useState(false);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSend = async () => {
    if (!validateEmail(email)) {
      setEmailError("Veuillez entrer une adresse e-mail valide");
      return;
    }
    setEmailError("");
    setEmailStatus("sending");

    try {
      await sendEmail(sessionId!, email);
      setEmailStatus("sent");
      playSuccess();
    } catch {
      setEmailStatus("error");
    }
  };

  if (showQr) {
    return (
      <div className="flex flex-col min-h-screen px-8 py-10 animate-float-in">
        <button
          onClick={() => setShowQr(false)}
          className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span className="font-body text-sm">Retour</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <h2 className="font-display text-3xl text-foreground">Scanner le QR code</h2>
          <div className="w-10 h-px bg-primary/40 mx-auto" />

          <div className="w-56 h-56 rounded-2xl border-2 border-border bg-card flex items-center justify-center shadow-md">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="QR Code"
                className="w-48 h-48 rounded-lg"
              />
            ) : (
              <div className="text-muted-foreground/40 text-sm">QR code indisponible</div>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Scannez pour télécharger votre photo
          </p>

          <AutoRedirectCountdown seconds={15} onComplete={restart} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 animate-float-in">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setScreen("result")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-body text-sm">Retour</span>
        </button>

        <button
          onClick={() => setShowQr(true)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <QrCode size={20} />
          <span className="font-body text-sm">QR code</span>
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 flex-1">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="font-display text-3xl text-foreground">Recevoir votre photo</h2>
          <div className="w-10 h-px bg-primary/40 mx-auto" />
        </div>

        {emailStatus === "sent" ? (
          <SuccessAutoRedirect restart={restart} message="Votre photo a bien été envoyée" detail={email} />
        ) : (
          <>
            {/* Email display */}
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

            {/* Virtual keyboard */}
            <div className="w-full max-w-md mt-2">
              <VirtualKeyboard
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setEmailError("");
                }}
                onSubmit={handleSend}
                submitDisabled={emailStatus === "sending" || !email}
              />
            </div>

            {emailStatus === "sending" && (
              <p className="text-muted-foreground font-body animate-pulse mt-2">Envoi en cours…</p>
            )}

            {/* Restart link */}
            <button onClick={restart} className="text-sm text-muted-foreground/60 mt-2 flex items-center gap-1.5">
              <RotateCcw size={14} />
              Recommencer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
