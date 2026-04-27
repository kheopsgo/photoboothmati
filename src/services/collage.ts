/**
 * Build a 2x2 collage from 4 image URLs/data URLs.
 * Returns a PNG data URL. Uses 3:4 portrait tiles to match the preview.
 */
export async function buildCollage2x2(photoUrls: string[]): Promise<string> {
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

  // Each tile in 3:4 ratio. Final canvas keeps the 3:4 portrait ratio overall.
  const tileW = 600;
  const tileH = 800;
  const gap = 16;
  const padding = 16;

  const canvasW = padding * 2 + tileW * 2 + gap;
  const canvasH = padding * 2 + tileH * 2 + gap;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D non disponible");

  // White background (the frame is applied separately by the backend overlay)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const drawCover = (img: HTMLImageElement, dx: number, dy: number, dw: number, dh: number) => {
    const srcRatio = img.width / img.height;
    const dstRatio = dw / dh;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (srcRatio > dstRatio) {
      // crop sides
      sw = img.height * dstRatio;
      sx = (img.width - sw) / 2;
    } else {
      // crop top/bottom
      sh = img.width / dstRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  };

  const positions = [
    [padding, padding],
    [padding + tileW + gap, padding],
    [padding, padding + tileH + gap],
    [padding + tileW + gap, padding + tileH + gap],
  ];

  images.forEach((img, i) => {
    const [x, y] = positions[i];
    drawCover(img, x, y, tileW, tileH);
  });

  return canvas.toDataURL("image/png");
}
