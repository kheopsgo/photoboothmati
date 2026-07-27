// High-quality client-side composition of the final photobooth image.
// - Renders 1 or 4 landscape photos rotated -90° and cropped to fill a 3:4 portrait area.
// - Optionally overlays a PhotoFrame (rendered offscreen) with the hole punched out.
// Returns a PNG data URL.

import { toCanvas } from "html-to-image";

export interface ComposeOptions {
  /** Fully-loaded photo URLs (or data URLs). 1 for single mode, 4 for grid mode. */
  photos: string[];
  /** Mounted PhotoFrame DOM element containing a [data-frame-photo-hole] slot. */
  frameEl?: HTMLElement | null;
  /** Final image width in pixels. Default 1200. */
  targetWidth?: number;
  /** Final image height in pixels. Default 1600. */
  targetHeight?: number;
  /** Mirror photos horizontally (selfie feel). Default false — printed photos keep true orientation. */
  mirrored?: boolean;
  /** White border between the 4 cells in grid mode, in target pixels. Default = 1.5% of hole width. */
  gridGapPx?: number;
}

export async function composeFinalImage(opts: ComposeOptions): Promise<string> {
  const targetWidth = opts.targetWidth ?? 1200;
  const targetHeight = opts.targetHeight ?? 1600;
  const { photos, frameEl, mirrored } = opts;

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const ctx = finalCanvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  const loaded = await Promise.all(photos.map(loadImage));

  // No frame: photos fill the whole canvas at 3:4 (auto-fit inside target).
  if (!frameEl) {
    const holeRect = fitPortraitInside(targetWidth, targetHeight);
    drawPhotos(ctx, loaded, holeRect, mirrored, opts.gridGapPx);
    return finalCanvas.toDataURL("image/png");
  }

  // With frame: render the frame to a canvas, find the hole rect, draw photos there,
  // then punch the hole in the frame canvas and stack it on top.
  const rect = frameEl.getBoundingClientRect();
  const pixelRatio = Math.max(
    1,
    Math.max(targetWidth / rect.width, targetHeight / rect.height)
  );

  await (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready?.catch(() => {});

  const frameCanvas = await toCanvas(frameEl, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: undefined,
    width: rect.width,
    height: rect.height,
  });

  // Fit frame canvas into target (letterbox on white).
  const frameScale = Math.min(
    targetWidth / frameCanvas.width,
    targetHeight / frameCanvas.height
  );
  const fw = frameCanvas.width * frameScale;
  const fh = frameCanvas.height * frameScale;
  const fx = (targetWidth - fw) / 2;
  const fy = (targetHeight - fh) / 2;

  // Locate the [data-frame-photo-hole] within the frame element.
  const hole = frameEl.querySelector<HTMLElement>("[data-frame-photo-hole]");
  if (!hole) throw new Error("Frame photo hole (data-frame-photo-hole) not found");
  const holeRect = hole.getBoundingClientRect();
  const domToTarget = fw / rect.width;
  const hx = fx + (holeRect.left - rect.left) * domToTarget;
  const hy = fy + (holeRect.top - rect.top) * domToTarget;
  const hw = holeRect.width * domToTarget;
  const hh = holeRect.height * domToTarget;

  // Draw photos in hole.
  drawPhotos(ctx, loaded, { x: hx, y: hy, w: hw, h: hh }, mirrored, opts.gridGapPx);

  // Punch hole in frame overlay, then draw it on top.
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = frameCanvas.width;
  overlayCanvas.height = frameCanvas.height;
  const overlayCtx = overlayCanvas.getContext("2d")!;
  overlayCtx.drawImage(frameCanvas, 0, 0);
  overlayCtx.clearRect(
    (holeRect.left - rect.left) * (frameCanvas.width / rect.width),
    (holeRect.top - rect.top) * (frameCanvas.height / rect.height),
    holeRect.width * (frameCanvas.width / rect.width),
    holeRect.height * (frameCanvas.height / rect.height)
  );
  ctx.drawImage(overlayCanvas, fx, fy, fw, fh);

  return finalCanvas.toDataURL("image/png");
}

// --- helpers ------------------------------------------------------------

interface Rect { x: number; y: number; w: number; h: number }

function fitPortraitInside(W: number, H: number): Rect {
  // Photo hole aspect 3:4.
  const targetAspect = 3 / 4;
  let w = W, h = W / targetAspect;
  if (h > H) { h = H; w = H * targetAspect; }
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

function drawPhotos(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  rect: Rect,
  mirrored?: boolean,
  gridGapPx?: number
) {
  if (images.length <= 1) {
    drawRotatedCoverPortrait(ctx, images[0], rect, mirrored);
    return;
  }
  // 2x2 grid inside rect, with white gap acting as a passe-partout.
  const gap = gridGapPx ?? Math.max(6, rect.w * 0.015);
  const cellW = (rect.w - gap) / 2;
  const cellH = (rect.h - gap) / 2;
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cellRect: Rect = {
      x: rect.x + col * (cellW + gap),
      y: rect.y + row * (cellH + gap),
      w: cellW,
      h: cellH,
    };
    const img = images[i] ?? images[images.length - 1];
    drawRotatedCoverPortrait(ctx, img, cellRect, mirrored);
  }
}

/**
 * Draw a landscape image into a portrait `rect`, rotated -90° (counter-clockwise)
 * and cover-cropped so it fills the rect completely.
 *
 * After rotation:
 *   - image's own width axis becomes vertical on screen
 *   - image's own height axis becomes horizontal on screen
 * So to cover the rect (w × h), scale = max(w / img.height, h / img.width).
 */
function drawRotatedCoverPortrait(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rect: Rect,
  mirrored?: boolean
) {
  const scale = Math.max(rect.w / img.height, rect.h / img.width);
  const dw = img.width * scale;
  const dh = img.height * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate(-Math.PI / 2);
  if (mirrored) ctx.scale(-1, 1);
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image ${src}`));
    img.src = src;
  });
}
