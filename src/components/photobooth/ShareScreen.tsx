import { useState } from "react";
import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { sendEmail } from "@/services/api";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";

export default function ShareScreen() {
  const { sessionId, qrUrl, emailStatus, setEmailStatus, setScreen, restart } = usePhotobooth();
  const { playSuccess } = useSound();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

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

  return (
    <div className="flex flex-col min-h-screen px-8 py-10 animate-float-in">
      <button
        onClick={() => setScreen("result")}
        className="self-start flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        <span className="font-body text-sm">Retour</span>
      </button>

      <div className="flex-1 flex flex-col items-center gap-10">
        {/* Email section */}
        <div className="w-full max-w-sm space-y-5">
          <div className="text-center space-y-2">
            <h2 className="font-display text-3xl text-foreground">
              Recevoir votre photo
            </h2>
            <div className="w-10 h-px bg-primary/40 mx-auto" />
          </div>

          {emailStatus === "sent" ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-float-up">
              <CheckCircle size={48} className="text-accent-foreground" />
              <p className="font-display text-xl text-foreground text-center">
                Votre photo a bien été envoyée
              </p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className="w-full h-14 rounded-xl border-2 border-border bg-card px-5 text-lg font-body text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                />
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

              <Button
                variant="hero"
                size="touch"
                onClick={handleSend}
                disabled={emailStatus === "sending" || !email}
                className="w-full"
              >
                {emailStatus === "sending" ? (
                  <span className="animate-pulse">Envoi en cours…</span>
                ) : (
                  <>
                    <Mail size={20} />
                    Recevoir ma photo
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full max-w-sm">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground font-body">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* QR section */}
        <div className="w-full max-w-sm text-center space-y-4">
          <h3 className="font-display text-2xl text-foreground">
            Scanner le QR code
          </h3>

          <div className="mx-auto w-48 h-48 rounded-2xl border-2 border-border bg-card flex items-center justify-center shadow-md">
            {qrUrl ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code"
                className="w-40 h-40 rounded-lg"
              />
            ) : (
              <div className="text-muted-foreground/40 text-sm">QR code</div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Scannez pour télécharger votre photo
          </p>
        </div>

        {/* Restart */}
        <Button
          variant="ghost"
          size="lg"
          onClick={restart}
          className="text-muted-foreground mt-4"
        >
          <RotateCcw size={18} />
          Recommencer
        </Button>
      </div>
    </div>
  );
}
