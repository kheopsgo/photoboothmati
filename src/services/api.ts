// Configurable via VITE_API_BASE env var or defaults to same-network Raspberry Pi
export const API_BASE = import.meta.env.VITE_API_BASE || "http://10.10.10.191:5000";

// URL du flux MJPEG live de la caméra (Raspberry Pi). Configurable via VITE_STREAM_URL.
export const STREAM_URL =
  import.meta.env.VITE_STREAM_URL || `${API_BASE}/stream.mjpg`;

export type PhotoMode = "single" | "four";
export type PhotoFilter = "none" | "bw" | "sepia";

export interface TakePhotoResponse {
  sessionId: string;
  photos: string[];
  finalImage: string;
  qrUrl?: string;
}

export interface LatestPhotoResponse {
  sessionId: string;
  photos: string[];
  finalImage: string;
  qrUrl: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
}

/** Build a full image URL from a relative path returned by the backend */
export function buildImageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function takePhoto(
  mode: PhotoMode,
  filter: PhotoFilter
): Promise<TakePhotoResponse> {
  const res = await fetch(`${API_BASE}/take-photo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, filter }),
  });
  if (!res.ok) throw new Error("Erreur lors de la prise de photo");
  const data = await res.json();
  return {
    sessionId: data.sessionId,
    photos: (data.photos as string[]).map(buildImageUrl),
    finalImage: buildImageUrl(data.finalImage),
    qrUrl: data.qrUrl ? buildImageUrl(data.qrUrl) : undefined,
  };
}

export async function getLatestPhoto(
  sessionId: string
): Promise<LatestPhotoResponse> {
  const res = await fetch(`${API_BASE}/latest-photo?sessionId=${sessionId}`);
  if (!res.ok) throw new Error("Erreur lors de la récupération");
  const data = await res.json();
  return {
    ...data,
    photos: (data.photos as string[]).map(buildImageUrl),
    finalImage: buildImageUrl(data.finalImage),
  };
}

export async function sendEmail(
  sessionId: string,
  email: string
): Promise<SendEmailResponse> {
  const res = await fetch(`${API_BASE}/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, email }),
  });
  if (!res.ok) throw new Error("Erreur lors de l'envoi de l'e-mail");
  return res.json();
}
