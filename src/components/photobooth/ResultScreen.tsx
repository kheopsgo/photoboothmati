import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { Button } from "@/components/ui/button";
import { Mail, QrCode, RotateCcw, Printer } from "lucide-react";
import PhotoFrame from "./PhotoFrame";

export default function ResultScreen() {
  const { mode, photos, finalImage, setScreen, restart } = usePhotobooth();

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 animate-float-in">
      <div className="text-center mb-6">
        <h2 className="font-display text-3xl text-foreground">Votre photo</h2>
        <div className="w-10 h-px bg-primary/40 mx-auto mt-2" />
      </div>

      <div className="flex-1 flex items-center justify-center mb-8">
        <PhotoFrame variant={mode === "four" ? "strip" : "single"}>
          {mode === "four" ? (
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
          )}
        </PhotoFrame>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
        <Button variant="hero" size="lg" onClick={() => setScreen("share")} className="col-span-2">
          <Mail size={20} />
          Envoyer par e-mail
        </Button>
        <Button variant="elegant" size="lg" onClick={() => setScreen("share")}>
          <QrCode size={20} />
          QR code
        </Button>
        <Button variant="elegant" size="lg" disabled>
          <Printer size={20} />
          Imprimer
        </Button>
        <Button variant="ghost" size="lg" onClick={restart} className="col-span-2 text-muted-foreground">
          <RotateCcw size={18} />
          Recommencer
        </Button>
      </div>
    </div>
  );
}
