import { usePhotobooth } from "@/contexts/PhotoboothContext";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const FloatingPetal = ({ delay, left }: { delay: number; left: number }) => (
  <div
    className="absolute bottom-0 text-primary/20 animate-petal pointer-events-none"
    style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${6 + Math.random() * 4}s` }}
  >
    <Heart size={12 + Math.random() * 12} />
  </div>
);

export default function WelcomeScreen() {
  const { setScreen } = usePhotobooth();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-8 overflow-hidden">
      {/* Floating petals */}
      {[...Array(6)].map((_, i) => (
        <FloatingPetal key={i} delay={i * 1.3} left={10 + i * 15} />
      ))}

      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="flex flex-col items-center gap-8 animate-float-in z-10">
        {/* Monogram placeholder */}
        <div className="w-28 h-28 rounded-full border-2 border-primary/30 flex items-center justify-center bg-background/80 backdrop-blur-sm shadow-lg">
          <span className="font-display text-4xl text-primary font-semibold tracking-wide">
            A&B
          </span>
        </div>

        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="font-display text-5xl font-light text-foreground tracking-wide">
            Photobooth
          </h1>
          <div className="w-16 h-px bg-primary/40 mx-auto" />
          <p className="font-display text-xl text-muted-foreground italic">
            Immortalisez ce moment
          </p>
        </div>

        {/* CTA */}
        <Button
          variant="hero"
          size="touch"
          onClick={() => setScreen("mode")}
          className="mt-4 animate-float-up delay-500"
          style={{ animationFillMode: "both" }}
        >
          Commencer
        </Button>

        {/* Subtle hint */}
        <p className="text-sm text-muted-foreground/70 font-body animate-float-up delay-700" style={{ animationFillMode: "both" }}>
          Appuyez pour commencer
        </p>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  );
}
