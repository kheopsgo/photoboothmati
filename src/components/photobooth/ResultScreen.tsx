import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { Button } from "@/components/ui/button";
import { Mail, QrCode, RotateCcw, Printer } from "lucide-react";

export default function ResultScreen() {
  const { mode, photos, finalImage, setScreen } = usePhotobooth();

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 animate-float-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-3xl text-foreground">Votre photo</h2>
        <div className="w-10 h-px bg-primary/40 mx-auto mt-2" />
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center mb-8">
        {mode === "four" ? (
          <div className="bg-card border-2 border-border rounded-2xl p-3 shadow-xl">
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, i) => (
                <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {/* Decorative frame overlay */}
            <div className="text-center mt-3 pb-1">
              <p className="font-display text-lg text-primary/60 italic">A & B</p>
            </div>
          </div>
        ) : (
          <div className="relative bg-card border-2 border-border rounded-2xl p-3 shadow-xl max-w-[320px] w-full">
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
              <img
                src={finalImage || photos[0]}
                alt="Votre photo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center mt-3 pb-1">
              <p className="font-display text-lg text-primary/60 italic">A & B</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
        <Button
          variant="hero"
          size="lg"
          onClick={() => setScreen("share")}
          className="col-span-2"
        >
          <Mail size={20} />
          Envoyer par e-mail
        </Button>

        <Button
          variant="elegant"
          size="lg"
          onClick={() => setScreen("share")}
        >
          <QrCode size={20} />
          QR code
        </Button>

        <Button
          variant="elegant"
          size="lg"
          disabled
        >
          <Printer size={20} />
          Imprimer
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => {
            // Full restart
            const { restart } = usePhotobooth as any;
          }}
          className="col-span-2 text-muted-foreground"
        >
          <RotateCcw size={18} />
          Recommencer
        </Button>
      </div>
    </div>
  );
}
