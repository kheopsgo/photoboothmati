import { useState, useRef, useLayoutEffect } from "react";
import { Camera } from "lucide-react";

/**
 * Affiche une image en la pivotant de 90° vers la gauche UNIQUEMENT si
 * l'image source est en paysage (largeur > hauteur). Pour une image déjà
 * portrait (montage final backend), elle est affichée telle quelle.
 * Le conteneur s'adapte à la taille finale (post-rotation) pour éviter
 * les bandes noires.
 */
interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function SmartOrientedImage({ src, alt, className = "" }: Props) {
  const [error, setError] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (error || !src) {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-muted/40 text-muted-foreground w-full h-full ${className}`}>
        <Camera size={28} className="mb-2 opacity-70" />
        <p className="text-xs text-center px-2">{alt || "Image indisponible"}</p>
      </div>
    );
  }

  const rotate = dims ? dims.w > dims.h : false;

  // Compute display size that fits inside the box after rotation.
  let displayW = 0;
  let displayH = 0;
  if (dims && box.w > 0 && box.h > 0) {
    // effective aspect after rotation
    const effRatio = rotate ? dims.h / dims.w : dims.w / dims.h; // width/height as displayed
    const boxRatio = box.w / box.h;
    if (effRatio > boxRatio) {
      displayW = box.w;
      displayH = box.w / effRatio;
    } else {
      displayH = box.h;
      displayW = box.h * effRatio;
    }
  }

  // The <img> intrinsic orientation: when rotated, we render it at swapped dimensions.
  const imgW = rotate ? displayH : displayW;
  const imgH = rotate ? displayW : displayH;

  return (
    <div ref={containerRef} className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      {dims && displayW > 0 && (
        <img
          src={src}
          alt={alt}
          style={{
            width: imgW,
            height: imgH,
            transform: rotate ? "rotate(-90deg)" : undefined,
            transformOrigin: "center center",
            display: "block",
          }}
        />
      )}
      {/* hidden loader to get natural dimensions */}
      {!dims && (
        <img
          src={src}
          alt=""
          onLoad={(e) => {
            const t = e.currentTarget;
            setDims({ w: t.naturalWidth, h: t.naturalHeight });
          }}
          onError={() => setError(true)}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
        />
      )}
    </div>
  );
}
