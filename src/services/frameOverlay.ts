import { toCanvas } from "html-to-image";

export interface FrameHole {
  /** Position/size of the transparent photo area, normalized 0..1 */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FrameExport {
  dataUrl: string;
  hole: FrameHole;
  /** Couleur dominante du cadre autour de la zone photo (ex: "#1b2a4a") */
  bgColor: string;
}

/**
 * Renders a given DOM element (the PhotoFrame containing a marked photo
 * placeholder) as a PNG matching the backend's final photo ratio.
 *
 * Strategy:
 *   1. Render the full frame (with all decorative backgrounds, borders,
 *      ornaments, text) to a canvas — keeps the visual match with preview.
 *   2. Locate the child marked with [data-frame-photo-hole] and CLEAR that
 *      rectangle on the canvas, producing a fully transparent photo area
 *      so the backend can composite the real photo underneath.
 *   3. Export as PNG + the normalized geometry of that hole, so the backend
 *      can place the photo (or the 2x2 grid) exactly inside the visible area.
 */
export async function captureElementAsTransparentPng(
  el: HTMLElement,
  targetWidth = 1200,
  targetHeight = 1800
): Promise<FrameExport> {
  const rect = el.getBoundingClientRect();
  const pixelRatio = Math.max(targetWidth / rect.width, targetHeight / rect.height);

  const canvas = await toCanvas(el, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: undefined,
    width: rect.width,
    height: rect.height,
    style: {
      margin: "0",
      transform: "none",
    },
  });

  // Punch a transparent hole over the photo placeholder area
  let hole: FrameHole = { x: 0, y: 0, w: 1, h: 1 };
  let bgColor = "#ffffff";
  const holeEl = el.querySelector<HTMLElement>("[data-frame-photo-hole]");
  if (holeEl) {
    const holeRect = holeEl.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const hx = (holeRect.left - rect.left) * scaleX;
    const hy = (holeRect.top - rect.top) * scaleY;
    const hw = holeRect.width * scaleX;
    const hh = holeRect.height * scaleY;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Échantillonne la couleur du cadre juste à gauche de la zone photo
      try {
        const sx = Math.max(0, Math.min(canvas.width - 1, Math.round(hx - Math.max(3, hx * 0.4))));
        const sy = Math.max(0, Math.min(canvas.height - 1, Math.round(hy + hh / 2)));
        const [r, g, b, a] = ctx.getImageData(sx, sy, 1, 1).data;
        if (a > 200) {
          bgColor = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
        }
      } catch {
        /* ignore */
      }
      ctx.clearRect(hx, hy, hw, hh);
    }
    hole = {
      x: hx / canvas.width,
      y: hy / canvas.height,
      w: hw / canvas.width,
      h: hh / canvas.height,
    };
  }

  return { dataUrl: canvas.toDataURL("image/png"), hole, bgColor };
}
