/**
 * Build a 2x2 collage from 4 image URLs/data URLs.
 *
 * Le montage est dessiné sur une toile 1200x1800 (taille finale du backend) et
 * les 4 photos sont placées UNIQUEMENT dans la zone visible du cadre (le "trou"
 * transparent du PNG), qui est paysage (3:2).
 *
 * Les photos brutes de la caméra sont enregistrées "sur le côté" (contenu
 * paysage dans un fichier portrait) : chaque photo est d'abord tournée de 90°
 * antihoraire pour être à l'endroit, puis insérée en "contain" — entière
 * visible, jamais rognée.
 */

export interface CollageHole {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const FRAME_HOLE_STORAGE_KEY = "photobooth.frameHole";
export const FRAME_BG_STORAGE_KEY = "photobooth.frameBgColor";

/** Couleur de fond du montage (celle du cadre), par défaut blanc */
export function getSavedFrameBgColor(): string {
  try {
    const raw = localStorage.getItem(FRAME_BG_STORAGE_KEY);
    if (raw && /^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "#ffffff";
}

/** Zone photo par défaut (mesurée sur le cadre "elegant" : photo paysage en haut, infos dessous) */
const DEFAULT_HOLE: CollageHole = { x: 0.05, y: 0.065, w: 0.9, h: 0.4 };

export function getSavedFrameHole(): CollageHole {
  try {
    const raw = localStorage.getItem(FRAME_HOLE_STORAGE_KEY);
    if (!raw) return DEFAULT_HOLE;
    const parsed = JSON.parse(raw) as CollageHole;
    if (
      [parsed.x, parsed.y, parsed.w, parsed.h].every((n) => typeof n === "number" && isFinite(n)) &&
      parsed.x >= 0 && parsed.y >= 0 && parsed.w > 0 && parsed.h > 0 &&
      parsed.x + parsed.w <= 1.001 && parsed.y + parsed.h <= 1.001
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_HOLE;
}

/** Tourne une photo de 90° antihoraire pour remettre le contenu paysage à l'endroit. */
export function rotatePhotoUpright(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalHeight;
  canvas.height = img.naturalWidth;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponible");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return canvas;
}

export async function buildCollage2x2(
  photoUrls: string[],
  hole: CollageHole = getSavedFrameHole()
): Promise<string> {
  if (photoUrls.length < 4) {
    throw new Error("Le collage 2x2 nécessite 4 photos");
  }

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Impossible de charger l'image: ${src}`));
      img.src = src;
    });

  const images = await Promise.all(photoUrls.slice(0, 4).map(loadImage));
  const uprightImages = images.map(rotatePhotoUpright);

  // Toile finale identique au backend (1200x1800)
  const canvasW = 1200;
  const canvasH = 1800;
  const gap = 16;

  const areaX = hole.x * canvasW;
  const areaY = hole.y * canvasH;
  const areaW = hole.w * canvasW;
  const areaH = hole.h * canvasH;

  const tileW = (areaW - gap) / 2;
  const tileH = (areaH - gap) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponible");

  // Fond de la même couleur que le cadre (le cadre est composé par-dessus)
  ctx.fillStyle = getSavedFrameBgColor();
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Photo entière visible, réduite pour tenir dans sa case (aucun rognage)
  const drawContain = (source: HTMLImageElement | HTMLCanvasElement, dx: number, dy: number, dw: number, dh: number) => {
    const scale = Math.min(dw / source.width, dh / source.height);
    const w = source.width * scale;
    const h = source.height * scale;
    ctx.drawImage(source, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
  };

  const positions = [
    [areaX, areaY],
    [areaX + tileW + gap, areaY],
    [areaX, areaY + tileH + gap],
    [areaX + tileW + gap, areaY + tileH + gap],
  ];

  uprightImages.forEach((img, i) => {
    const [x, y] = positions[i];
    drawContain(img, x, y, tileW, tileH);
  });

  return canvas.toDataURL("image/jpeg", 0.92);
}
