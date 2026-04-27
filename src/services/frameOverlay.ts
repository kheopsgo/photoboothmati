import { toPng } from "html-to-image";

/**
 * Renders a given React node (the PhotoFrame containing a transparent hole)
 * as a transparent PNG matching the backend's final photo ratio.
 *
 * The element should already be mounted in the DOM (offscreen).
 * Returns a base64 data URL: "data:image/png;base64,..."
 */
export async function captureElementAsTransparentPng(
  el: HTMLElement,
  targetWidth = 1200,
  targetHeight = 1600
): Promise<string> {
  const rect = el.getBoundingClientRect();
  const pixelRatio = Math.max(targetWidth / rect.width, targetHeight / rect.height);

  const dataUrl = await toPng(el, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: undefined, // keep transparent
    width: rect.width,
    height: rect.height,
    style: {
      margin: "0",
      transform: "none",
    },
  });

  return dataUrl;
}
