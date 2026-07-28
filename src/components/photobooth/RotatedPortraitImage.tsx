import { useState } from "react";
import { Camera } from "lucide-react";

/**
 * Affiche une image (paysage) pivotée de 90° vers la gauche
 * et rognée pour remplir le cadre du parent (typiquement portrait 3:4).
 * Le parent doit avoir une taille définie (width + height).
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

  // On pivote l'image de -90°. Pour qu'elle recouvre entièrement un cadre portrait,
  // on la dimensionne pour que sa hauteur (avant rotation) == largeur du cadre,
  // et que sa largeur (avant rotation) == hauteur du cadre. object-cover fait le crop.
  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      style={style}
    >
      <img
        src={src}
        alt={alt}
        onError={handleError}
        className="absolute top-1/2 left-1/2 block max-w-none"
        style={{
          height: "100%",
          width: "100%",
          objectFit: "cover",
          transform: `translate(-50%, -50%) rotate(-90deg)${mirrored ? " scaleX(-1)" : ""}`,
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
