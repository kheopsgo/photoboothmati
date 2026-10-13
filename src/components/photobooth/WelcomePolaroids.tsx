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
        return (
          <div key={layer} className={`welcome-polaroid welcome-polaroid-${layer}`}>
            <div className="welcome-polaroid-photo">
              <FinalImage
                key={src}
                src={src}
                alt={layer === 0 ? "Dernier souvenir du photobooth" : ""}
                forceRotate
                className="h-full w-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}