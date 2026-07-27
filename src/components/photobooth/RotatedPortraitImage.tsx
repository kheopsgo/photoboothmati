import { useState } from "react";
import { Camera } from "lucide-react";

/**
 * Affiche une image paysage en la pivotant de 90° vers la gauche
 * et en la rognant pour remplir un cadre portrait (3:4).
 *
 * Utilisation :
 *   <RotatedPortraitImage src={streamUrl} alt="..." mirrored className="aspect-[3/4] rounded-2xl" />
 */
interface RotatedPortraitImageProps {
  src: string;
  alt: string;
  mirrored?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

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
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <div className="absolute top-1/2 left-1/2 h-full w-auto -translate-x-1/2 -translate-y-1/2 -rotate-90">
        <img
          src={src}
          alt={alt}
          className="block h-full w-auto max-w-none max-h-none object-cover"
          style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
          onError={handleError}
        />
      </div>
    </div>
  );
}
