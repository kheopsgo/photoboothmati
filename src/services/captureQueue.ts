import {
  takeSinglePhoto,
  type PhotoFilter,
  type TakeSinglePhotoResponse,
} from "./api";

// Holds an in-flight single-shot /take-photo promise that was started early
// (before the visual countdown reached 0) so CaptureFlow can await it instead
// of issuing a new request. This decouples the visible countdown from the
// real camera trigger to compensate for camera latency.
let pendingCapture: Promise<TakeSinglePhotoResponse> | null = null;

export function startEarlyCapture(
  filter: PhotoFilter,
  sessionId?: string | null
): Promise<TakeSinglePhotoResponse> {
  if (pendingCapture) return pendingCapture;
  pendingCapture = takeSinglePhoto(filter, sessionId).finally(() => {
    // Promise stays available until consumed by CaptureFlow.
  });
  return pendingCapture;
}

export function consumePendingCapture(): Promise<TakeSinglePhotoResponse> | null {
  const p = pendingCapture;
  pendingCapture = null;
  return p;
}

export function clearPendingCapture(): void {
  pendingCapture = null;
}
