import { toPng } from "html-to-image";

/**
 * Renders a given DOM element (the PhotoFrame containing a transparent
 * photo placeholder) as a PNG matching the backend's final photo ratio.
 *
 * Important: we KEEP all decorative backgrounds (card bg, borders, ornaments,
 * text) so the exported overlay visually matches the on-screen frame preview.
 * Only the inner photo placeholder must remain transparent — that is the
 * responsibility of the caller (it should render a child with
 * `background: transparent`).
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
    // Leave backgroundColor undefined so the PNG keeps its alpha channel.
    // Pixels not painted by any element stay transparent — including the
    // inner photo placeholder which has background: transparent.
    backgroundColor: undefined,
    width: rect.width,
    height: rect.height,
    style: {
      margin: "0",
      transform: "none",
    },
  });

  return dataUrl;
}
