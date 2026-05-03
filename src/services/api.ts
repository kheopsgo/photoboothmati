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

/**
 * Capture a single shot. Used by the frontend-driven 4-photo loop so we can
 * show the live preview + countdown between each photo.
 * Backend should return at least: { sessionId, photo: "/photos/xxx.jpg" }.
 */
export interface TakeSinglePhotoResponse {
  sessionId: string;
  photo: string;
}

export async function takeSinglePhoto(
  filter: PhotoFilter,
  sessionId?: string | null,
  options?: { applyFrame?: boolean; partOfGrid?: boolean }
): Promise<TakeSinglePhotoResponse> {
  const applyFrame = options?.applyFrame ?? true;
  const partOfGrid = options?.partOfGrid ?? false;
  const res = await fetch(`${API_BASE}/take-photo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "single",
      filter,
      sessionId: sessionId ?? undefined,
      // Hints for the backend: when this shot is part of a 4-photo grid,
      // we want the raw (unframed) photo so the frame is applied only once
      // on the final 2x2 composition by /create-grid.
      applyFrame,
      partOfGrid,
      raw: !applyFrame,
    }),
  });
  if (!res.ok) throw new Error("Erreur lors de la prise de photo");
  const data = await res.json();
  // Backend may return { photo } or { photos: [..], finalImage }
  const photoPath: string =
    data.photo ?? (Array.isArray(data.photos) ? data.photos[0] : data.finalImage);
  return {
    sessionId: data.sessionId,
    photo: buildImageUrl(photoPath),
  };
}

/**
 * Ask the backend to assemble the 2x2 grid from 4 already-captured photos,
 * apply the frame, and generate the QR code.
 */
export async function createGrid(
  photos: string[],
  filter: PhotoFilter,
  sessionId?: string | null
): Promise<TakePhotoResponse> {
  // Send back relative paths if possible (strip API_BASE)
  const normalized = photos.map((p) =>
    p.startsWith(API_BASE) ? p.slice(API_BASE.length) : p
  );
  const res = await fetch(`${API_BASE}/create-grid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photos: normalized, filter, sessionId: sessionId ?? undefined }),
  });
  if (!res.ok) throw new Error("Erreur lors de la création du montage");
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

export interface WifiConfigResponse {
  success: boolean;
  message?: string;
}

export interface WifiNetwork {
  ssid: string;
  signal: string;
  security: string;
}

export interface WifiNetworksResponse {
  success: boolean;
  networks: WifiNetwork[];
}

export async function getWifiNetworks(): Promise<WifiNetworksResponse> {
  const res = await fetch(`${API_BASE}/wifi-networks`);
  if (!res.ok) {
    let backendMessage = "";
    try {
      const data = await res.json();
      backendMessage = data?.message || data?.error || "";
    } catch {
      try {
        backendMessage = await res.text();
      } catch {
        // ignore
      }
    }
    throw new Error(backendMessage || "Erreur lors du chargement des réseaux Wi-Fi");
  }
  return res.json();
}

export async function configureWifi(
  ssid: string,
  password: string
): Promise<WifiConfigResponse> {
  const res = await fetch(`${API_BASE}/wifi-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ssid, password }),
  });
  if (!res.ok) {
    let backendMessage = "";
    try {
      const data = await res.json();
      backendMessage = data?.message || data?.error || "";
    } catch {
      try {
        backendMessage = await res.text();
      } catch {
        // ignore
      }
    }
    throw new Error(backendMessage || "Erreur lors de la connexion Wi-Fi");
  }
  return res.json();
}

export async function sendEmail(
  email: string,
  image: string
): Promise<SendEmailResponse> {
  const res = await fetch(`${API_BASE}/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, image }),
  });
  if (!res.ok) {
    let backendMessage = "";
    try {
      const data = await res.json();
      backendMessage = data?.message || data?.error || "";
    } catch {
      try {
        backendMessage = await res.text();
      } catch {
        // ignore
      }
    }
    throw new Error(backendMessage || "Erreur lors de l'envoi de l'e-mail");
  }
  return res.json();
}

export interface PrintPhotoResponse {
  success: boolean;
  message?: string;
}

export interface FrameUploadResponse {
  success: boolean;
  message?: string;
}

export async function uploadFrame(imageDataUrl: string): Promise<FrameUploadResponse> {
  const res = await fetch(`${API_BASE}/frame-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl }),
  });
  if (!res.ok) {
    let backendMessage = "";
    try {
      const data = await res.json();
      backendMessage = data?.message || data?.error || "";
    } catch {
      try {
        backendMessage = await res.text();
      } catch {
        // ignore
      }
    }
    throw new Error(backendMessage || "Erreur lors de l'enregistrement du cadre");
  }
  return res.json();
}

export async function printPhoto(image: string): Promise<PrintPhotoResponse> {
  const res = await fetch(`${API_BASE}/print-photo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  if (!res.ok) {
    let backendMessage = "";
    try {
      const data = await res.json();
      backendMessage = data?.message || data?.error || "";
    } catch {
      try {
        backendMessage = await res.text();
      } catch {
        // ignore
      }
    }
    throw new Error(backendMessage || "Erreur lors de l'impression");
  }
  return res.json();
}

export interface UpdateFrontendResponse {
  success: boolean;
  message?: string;
}

export interface TrashPhotosResponse {
  success: boolean;
  message?: string;
}

export async function trashPhotos(): Promise<TrashPhotosResponse> {
  const res = await fetch(`${API_BASE}/trash-photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    let backendMessage = "";
    try {
      const data = await res.json();
      backendMessage = data?.message || data?.error || "";
    } catch {
      try {
        backendMessage = await res.text();
      } catch {
        // ignore
      }
    }
    throw new Error(backendMessage || "Erreur lors de la mise à la corbeille");
  }
  return res.json();
}

export async function updateFrontend(): Promise<UpdateFrontendResponse> {
  const res = await fetch(`${API_BASE}/update-frontend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    let backendMessage = "";
    try {
      const data = await res.json();
      backendMessage = data?.message || data?.error || "";
    } catch {
      try {
        backendMessage = await res.text();
      } catch {
        // ignore
      }
    }
    throw new Error(backendMessage || "Erreur lors de la mise à jour depuis GitHub");
  }
  return res.json();
}
