import type { ReactNode } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Heart } from "lucide-react";

interface PhotoFrameProps {
  children: ReactNode;
  variant?: "single" | "strip";
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={`frame-ornament text-primary/30 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M2 38 C2 20 20 2 38 2" />
      <path d="M6 38 C6 24 24 6 38 6" />
      <circle cx="38" cy="2" r="1.5" fill="currentColor" />
    </svg>
  );
}

function BotanicalAccent({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 20" className={`frame-botanical text-primary/25 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="0.8">
      <path d="M30 18 C25 14 15 10 5 12 C15 8 25 4 30 2 C35 4 45 8 55 12 C45 10 35 14 30 18Z" />
      <path d="M30 14 C28 12 22 10 16 11" />
      <path d="M30 14 C32 12 38 10 44 11" />
    </svg>
  );
}

function GeometricBorder() {
  return (
    <div className="absolute inset-3 pointer-events-none">
      <div className="w-full h-full border border-primary/20" />
      <div className="absolute top-1 left-1 right-1 bottom-1 border border-primary/10" />
    </div>
  );
}

/**
 * Cadre photo : la zone photo est toujours PAYSAGE (3:2) et les infos de
 * l'événement (monogramme / titre / date / message) sont placées SOUS la
 * photo — comme l'exemple d'impression validé. Le conteneur racine doit
 * avoir un ratio 2:3 (1200x1800 à l'export) : passer h-full + un parent
 * avec aspect-[2/3].
 */
export default function PhotoFrame({ children, variant = "single" }: PhotoFrameProps) {
  const { settings } = useSettings();
  const { frameStyle, monogram, title, subtitle, footer, logoUrl } = settings.eventConfig;

  const accentStyle = settings.eventConfig.accentColor
    ? { "--frame-accent": settings.eventConfig.accentColor } as React.CSSProperties
    : {};

  if (frameStyle === "polaroid") {
    return (
      <div
        className="photo-frame bg-[hsl(var(--polaroid-paper))] rounded-sm shadow-xl p-[3%] pb-[5%] relative flex h-full w-full flex-col"
        style={accentStyle}
      >
        <div data-frame-photo-slot className="w-full aspect-[3/2]">
          {children}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-script frame-title text-foreground/80">{title}</p>
          <p className="font-body frame-subtitle text-muted-foreground mt-[1%]">{subtitle}</p>
        </div>
      </div>
    );
  }

  if (frameStyle === "minimal") {
    return (
      <div
        className="photo-frame bg-card border border-border rounded-2xl p-[4%] shadow-lg relative flex h-full w-full flex-col"
        style={accentStyle}
      >
        <div data-frame-photo-slot className="w-full aspect-[3/2]">
          {children}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-script frame-monogram text-primary/60">{monogram}</p>
          <p className="font-body frame-subtitle text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    );
  }

  if (frameStyle === "geometric") {
    return (
      <div
        className="photo-frame bg-card rounded-2xl p-[4%] shadow-xl relative flex h-full w-full flex-col"
        style={accentStyle}
      >
        <GeometricBorder />
        <div className="relative z-10 flex h-full w-full flex-col">
          <div data-frame-photo-slot className="mx-auto w-[92%] aspect-[3/2]">
            {children}
          </div>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-script frame-title text-foreground">{title}</p>
            <p className="font-body frame-subtitle text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  if (frameStyle === "botanical") {
    return (
      <div
        className="photo-frame bg-card border-2 border-border rounded-2xl p-[4%] shadow-xl relative overflow-hidden flex h-full w-full flex-col"
        style={accentStyle}
      >
        <div className="flex shrink-0 justify-center">
          <BotanicalAccent />
        </div>

        <div data-frame-photo-slot className="mx-auto mt-[2%] w-[92%] aspect-[3/2]">
          {children}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <BotanicalAccent className="rotate-180" />
          <p className="font-script frame-title text-primary/70">{title}</p>
          <p className="font-body frame-subtitle text-muted-foreground">{subtitle}</p>
          {footer && <p className="font-body frame-footer text-muted-foreground/60 mt-[1%]">{footer}</p>}
        </div>
      </div>
    );
  }

  // Default: elegant — photo paysage en haut, infos en dessous.
  return (
    <div
      className="photo-frame bg-card border-2 border-primary/15 rounded-2xl shadow-xl relative overflow-hidden flex h-full w-full flex-col"
      style={accentStyle}
    >
      {/* Ornaments top */}
      <div className="flex shrink-0 justify-between px-[2.5%] pt-[2%]">
        <CornerOrnament />
        <CornerOrnament className="scale-x-[-1]" />
      </div>

      {/* Logo if provided */}
      {logoUrl && (
        <div className="flex shrink-0 justify-center pt-[1%]">
          <img src={logoUrl} alt="Logo" className="h-[4.5cqw] w-auto object-contain opacity-60" />
        </div>
      )}

      {/* Photo paysage (3:2), entière visible */}
      <div data-frame-photo-slot className="mx-auto mt-[1.5%] w-[90%] aspect-[3/2]">
        {children}
      </div>

      {/* Infos de l'événement SOUS la photo */}
      <div className="flex flex-1 flex-col items-center justify-center gap-[2.5cqw] px-[6%] pb-[2%] text-center">
        <div className="flex w-full items-center justify-center gap-[3%]">
          <div className="h-px flex-1 bg-primary/20" />
          <Heart className="text-primary/40 w-[2.5cqw] h-[2.5cqw]" />
          <div className="h-px flex-1 bg-primary/20" />
        </div>
        <p className="font-script frame-title text-primary/80">{title}</p>
        <p className="font-body frame-subtitle text-muted-foreground">{subtitle}</p>
        {footer && <p className="font-body frame-footer text-muted-foreground/50">{footer}</p>}
      </div>

      {/* Ornaments bottom */}
      <div className="flex shrink-0 justify-between px-[2.5%] pb-[2%]">
        <CornerOrnament className="scale-y-[-1]" />
        <CornerOrnament className="scale-[-1]" />
      </div>
    </div>
  );
}
