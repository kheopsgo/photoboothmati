import { useState } from "react";
import { Camera } from "lucide-react";

interface RotatedPortraitImageProps {
  src: string;
  alt: string;
  mirrored?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

/**
 * Pivote l'image de -90° et la rogne pour remplir un cadre portrait.
 * Le parent doit avoir une taille définie (width + height explicites via aspect-ratio + hauteur).
 */
export default function RotatedPortraitImage({
  src,
  alt,
  mirrored = false,
  className = "",
  style,
  onError,
}: RotatedPortraitImageProps) {
  const [error, setError] = useState(false);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    setError(true);
    onError?.(e);
  };

  if (error || !src) {
    return (
      <div
        className={`relative overflow-hidden flex flex-col items-center justify-center bg-muted/40 text-muted-foreground ${className}`}
        style={style}
      >
        <Camera size={28} className="mb-2 opacity-70" />
        <p className="text-xs text-center px-2">{alt || "Image indisponible"}</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`} style={style}>
      <img
        src={src}
        alt={alt}
        onError={handleError}
        className="absolute top-1/2 left-1/2 block max-w-none"
        style={{
          height: "100%",
          width: "auto",
          transform: `translate(-50%, -50%) rotate(-90deg)${mirrored ? " scaleX(-1)" : ""}`,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
