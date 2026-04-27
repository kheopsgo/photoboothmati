import { toPng } from "html-to-image";

/**
 * Renders a given React node (the PhotoFrame containing a transparent hole)
 * as a transparent PNG matching the backend's final photo ratio.
 *
 * The element should already be mounted in the DOM (offscreen) and styled
 * so that ALL backgrounds inside it are transparent — only decorative
 * elements (borders, text, ornaments, logos) should be opaque.
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

  const dataUrl = await toPng(el, {
    cacheBust: true,
    pixelRatio,
    // Do NOT set backgroundColor — leave it undefined so the PNG keeps its
    // alpha channel and only painted elements remain visible.
    backgroundColor: undefined,
    width: rect.width,
    height: rect.height,
    style: {
      margin: "0",
      transform: "none",
      background: "transparent",
      backgroundColor: "transparent",
    },
    // Defensive: strip any inline background that might have leaked through.
    filter: (node) => {
      if (node instanceof HTMLElement) {
        if (node.style && node.style.backgroundColor) {
          node.style.backgroundColor = "transparent";
        }
        if (node.style && node.style.background) {
          node.style.background = "transparent";
        }
      }
      return true;
    },
  });

  return dataUrl;
}
