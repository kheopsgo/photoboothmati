import { takePhoto, type PhotoFilter, type TakePhotoResponse } from "./api";

// Holds an in-flight /take-photo promise that was started early (before the
// visual countdown reached 0) so CaptureFlow can await it instead of issuing
// a new request. This lets us decouple the visible countdown from the real
// camera trigger to compensate for camera latency.
let pendingCapture: Promise<TakePhotoResponse> | null = null;

export function startEarlyCapture(filter: PhotoFilter): Promise<TakePhotoResponse> {
  // If one is already in-flight, reuse it (guards against double trigger).
  if (pendingCapture) return pendingCapture;
  pendingCapture = takePhoto("single", filter).finally(() => {
    // Promise stays available for one consumer; cleared after consumption.
  });
  return pendingCapture;
}

export function consumePendingCapture(): Promise<TakePhotoResponse> | null {
  const p = pendingCapture;
  pendingCapture = null;
  return p;
}

export function clearPendingCapture(): void {
  pendingCapture = null;
}
