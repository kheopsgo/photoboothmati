import { toCanvas } from "html-to-image";

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
 *   3. Export as PNG.
 *
 * Returns a base64 data URL: "data:image/png;base64,..."
 */
export async function captureElementAsTransparentPng(
  el: HTMLElement,
  targetWidth = 1200,
  targetHeight = 1600
): Promise<string> {
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
  const hole = el.querySelector<HTMLElement>("[data-frame-photo-hole]");
  if (hole) {
    const holeRect = hole.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const hx = (holeRect.left - rect.left) * scaleX;
    const hy = (holeRect.top - rect.top) * scaleY;
    const hw = holeRect.width * scaleX;
    const hh = holeRect.height * scaleY;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(hx, hy, hw, hh);
    }
  }

  return canvas.toDataURL("image/png");
}
