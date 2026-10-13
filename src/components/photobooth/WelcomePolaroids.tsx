import { useEffect, useState } from "react";
import FinalImage from "./FinalImage";

export const POLAROID_INTERVAL_MS = 5000;

export default function WelcomePolaroids({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (photos.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % photos.length);
    }, POLAROID_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [photos]);

  if (!photos.length) return null;

  return (
    <div className="welcome-polaroids" role="img" aria-label="Souvenirs du photobooth">
      {[2, 1, 0].map((layer) => {
        const src = photos[(index + layer) % photos.length];
        const adjacentPhotos = [...new Set([
          photos[(index + layer + photos.length - 1) % photos.length],
          src,
          photos[(index + layer + 1) % photos.length],
        ])];
        return (
          <div key={layer} className={`welcome-polaroid welcome-polaroid-${layer}`}>
            <div className="welcome-polaroid-photo">
              {adjacentPhotos.map((photo) => (
                <div
                  key={photo}
                  className={`welcome-polaroid-image${photo === src ? " is-current" : ""}`}
                  aria-hidden={photo !== src}
                >
                  <FinalImage
                    src={photo}
                    alt={layer === 0 && photo === src ? "Dernier souvenir du photobooth" : ""}
                    forceRotate
                    className="h-full w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}