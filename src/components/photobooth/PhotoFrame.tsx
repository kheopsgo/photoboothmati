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

export default function PhotoFrame({ children, variant = "single" }: PhotoFrameProps) {
  const { settings } = useSettings();
  const { frameStyle, monogram, title, subtitle, footer, logoUrl } = settings.eventConfig;

  const accentStyle = settings.eventConfig.accentColor
    ? { "--frame-accent": settings.eventConfig.accentColor } as React.CSSProperties
    : {};

  if (frameStyle === "polaroid") {
    return (
      <div className="photo-frame bg-card rounded-sm shadow-xl p-[3%] pb-[22%] relative" style={accentStyle}>
        {children}
        <div className="absolute bottom-[5%] left-0 right-0 text-center px-[4%]">
          <p className="font-script frame-title text-foreground/80">{title}</p>
          <p className="font-body frame-subtitle text-muted-foreground mt-[1.5%]">{subtitle}</p>
        </div>
      </div>
    );
  }

  if (frameStyle === "minimal") {
    return (
      <div className="photo-frame bg-card border border-border rounded-2xl p-[4%] shadow-lg relative" style={accentStyle}>
        {children}
        <div className="text-center mt-[4%] space-y-[1.5%]">
          <p className="font-script frame-monogram text-primary/60">{monogram}</p>
          <p className="font-body frame-subtitle text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    );
  }

  if (frameStyle === "geometric") {
    return (
      <div className="photo-frame bg-card rounded-2xl p-[5%] shadow-xl relative" style={accentStyle}>
        <GeometricBorder />
        <div className="relative z-10">
          {children}
          <div className="text-center mt-[5%] space-y-[1.5%]">
            <p className="font-script frame-title text-foreground">{title}</p>
            <p className="font-body frame-subtitle text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  if (frameStyle === "botanical") {
    return (
      <div className="photo-frame bg-card border-2 border-border rounded-2xl p-[4%] shadow-xl relative overflow-hidden" style={accentStyle}>
        {/* Top botanical */}
        <div className="flex justify-center mb-[2%]">
          <BotanicalAccent />
        </div>

        {children}

        {/* Bottom botanical + text */}
        <div className="text-center mt-[3%] space-y-[1.5%]">
          <BotanicalAccent className="mx-auto rotate-180" />
          <p className="font-script frame-title text-primary/70">{title}</p>
          <p className="font-body frame-subtitle text-muted-foreground">{subtitle}</p>
          {footer && <p className="font-body frame-footer text-muted-foreground/60 mt-[2%]">{footer}</p>}
        </div>
      </div>
    );
  }

  // Default: elegant
  return (
    <div className="photo-frame bg-card border-2 border-primary/15 rounded-2xl shadow-xl relative overflow-hidden" style={accentStyle}>
      {/* Top ornaments */}
      <div className="flex justify-between px-[2%] pt-[2%]">
        <CornerOrnament />
        <CornerOrnament className="scale-x-[-1]" />
      </div>

      {/* Logo if provided */}
      {logoUrl && (
        <div className="flex justify-center -mt-[2%] mb-[1%]">
          <img src={logoUrl} alt="Logo" className="h-[8cqw] w-auto object-contain opacity-60" />
        </div>
      )}

      <div className="px-[4%] pb-[1%]">
        {children}
      </div>

      {/* Bottom section */}
      <div className="px-[5%] pb-[4%] pt-[3%]">
        <div className="flex items-center gap-[3%] justify-center">
          <div className="h-px flex-1 bg-primary/20" />
          <Heart className="text-primary/40 w-[3cqw] h-[3cqw]" />
          <div className="h-px flex-1 bg-primary/20" />
        </div>
        <div className="text-center mt-[3%] space-y-[1.5%]">
          <p className="font-script frame-title text-primary/80">{title}</p>
          <p className="font-body frame-subtitle text-muted-foreground">{subtitle}</p>
          {footer && <p className="font-body frame-footer text-muted-foreground/50 mt-[2%]">{footer}</p>}
        </div>
      </div>

      {/* Bottom ornaments */}
      <div className="flex justify-between px-[2%] pb-[2%]">
        <CornerOrnament className="scale-y-[-1]" />
        <CornerOrnament className="scale-[-1]" />
      </div>
    </div>
  );
}
