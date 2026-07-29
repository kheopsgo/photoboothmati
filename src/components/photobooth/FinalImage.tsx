import { useEffect, useRef, useState } from "react";
import { Loader2, ImageOff } from "lucide-react";

interface FinalImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  /** Force la rotation -90° même si l'image est déjà en portrait */
  forceRotate?: boolean;
}

type Status = "loading" | "ready" | "error";

const MAX_ATTEMPTS = 3;

function withBuster(src: string, attempt: number) {
  // Ne jamais busteriser les data: URLs
  if (!src || src.startsWith("data:") || src.startsWith("blob:") || attempt === 0) return src;
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}_r=${attempt}-${Date.now()}`;
}

/**
 * Affiche l'image finale (montage backend ou photo unique) de façon fiable :
 * - précharge + decode() hors DOM (évite les rendus vides sur Chromium/PWA)
 * - retries automatiques avec anti-cache
 * - détection d'orientation : pivote uniquement si l'image est en paysage
 */
export default function FinalImage({
  src,
  alt,
  className = "",
  style,
  forceRotate = false,
}: FinalImageProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [resolvedSrc, setResolvedSrc] = useState<string>("");
  const [landscape, setLandscape] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;

    setStatus("loading");
    setResolvedSrc("");

    if (!src) {
      setStatus("error");
      return;
    }

    const tryLoad = () => {
      const candidate = withBuster(src, attempt);
      const img = new Image();
      img.decoding = "async";
      // Autorise le rendu depuis une origine différente (Flask) sans taint bloquant
      img.crossOrigin = "anonymous";

      const onFail = () => {
        if (cancelled) return;
        attempt += 1;
        if (attempt < MAX_ATTEMPTS) {
          timerRef.current = window.setTimeout(tryLoad, 350 * attempt);
        } else {
          setStatus("error");
        }
      };

      img.onload = () => {
        if (cancelled) return;
        if (!img.naturalWidth || !img.naturalHeight) {
          onFail();
          return;
        }
        setLandscape(img.naturalWidth > img.naturalHeight);
        setDims({ w: img.naturalWidth, h: img.naturalHeight });
        setResolvedSrc(candidate);
        setStatus("ready");
      };
      img.onerror = () => {
        // Retente sans crossOrigin (certains backends n'envoient pas les en-têtes CORS)
        if (cancelled) return;
        const plain = new Image();
        plain.decoding = "async";
        plain.onload = () => {
          if (cancelled) return;
          setLandscape(plain.naturalWidth > plain.naturalHeight);
          setDims({ w: plain.naturalWidth, h: plain.naturalHeight });
          setResolvedSrc(candidate);
          setStatus("ready");
        };
        plain.onerror = onFail;
        plain.src = candidate;
      };
      img.src = candidate;
    };

    tryLoad();

    return () => {
      cancelled = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [src]);

  if (status === "loading") {
    return (
      <div className={`flex items-center justify-center bg-muted/20 ${className}`} style={style}>
        <Loader2 size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-muted/30 text-muted-foreground ${className}`}
        style={style}
      >
        <ImageOff size={28} className="opacity-70" />
        <p className="px-3 text-center text-xs">{alt || "Image indisponible"}</p>
      </div>
    );
  }

  const rotate = forceRotate || landscape;

  if (!rotate) {
    return (
      <img
        key={resolvedSrc}
        src={resolvedSrc}
        alt={alt}
        className={`object-contain ${className}`}
        style={style}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`} style={style}>
      <img
        key={resolvedSrc}
        src={resolvedSrc}
        alt={alt}
        className="absolute left-1/2 top-1/2 block max-w-none"
        style={{
          height: "100%",
          width: "auto",
          transform: "translate(-50%, -50%) rotate(-90deg)",
          transformOrigin: "center center",
        }}
      />
    </div>
  );
}
