const FLASK_PORT = "5000";
const HOTSPOT_HOST = "10.42.0.1";

export function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE;
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window === "undefined") return `http://${HOTSPOT_HOST}:${FLASK_PORT}`;

  const { hostname, port, protocol } = window.location;
  if (port === FLASK_PORT) return "";

  const isPreviewHost = hostname.includes("lovable") || hostname === "localhost" || hostname === "127.0.0.1";
  const backendHost = isPreviewHost ? HOTSPOT_HOST : hostname;
  return `http://${backendHost}:${FLASK_PORT}`;
}

export function resolveApiBases(): string[] {
  const primary = resolveApiBase();
  const bases = [primary];
  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    if (port !== FLASK_PORT) bases.push(`http://${HOTSPOT_HOST}:${FLASK_PORT}`);
    if (hostname !== HOTSPOT_HOST && !hostname.includes("lovable")) bases.push(`http://${hostname}:${FLASK_PORT}`);
  }
  return [...new Set(bases.map((base) => base.replace(/\/$/, "")))];
}

/** fetch avec timeout pour éviter les requêtes qui traînent indéfiniment. */
export async function fetchWithTimeout(
  input: RequestInfo,
  init?: RequestInit,
  timeoutMs = 10000
): Promise<Response> {
  const ctrl = new AbortController();
  const id = window.setTimeout(
    () => ctrl.abort(new DOMException(`Timeout après ${Math.round(timeoutMs / 1000)}s`, "TimeoutError")),
    timeoutMs
  );
  try {
    const res = await fetch(input, { ...init, signal: ctrl.signal });
    return res;
  } finally {
    window.clearTimeout(id);
  }
}

/** Extrait un message d'erreur lisible depuis une réponse non-OK. */
async function extractBackendMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || data?.error || "";
  } catch {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }
}

// Backend Flask du Raspberry Pi, résolu dynamiquement depuis la page courante.
export const API_BASE = resolveApiBase();

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
  const res = await fetchWithTimeout(
    `${API_BASE}/take-photo`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, filter }),
    },
    15000
  );
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
  const res = await fetchWithTimeout(
    `${API_BASE}/take-photo`,
    {
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
    },
    15000
  );
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
  const res = await fetchWithTimeout(
    `${API_BASE}/create-grid`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos: normalized, filter, sessionId: sessionId ?? undefined }),
    },
    30000
  );
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
  const res = await fetchWithTimeout(
    `${API_BASE}/latest-photo?sessionId=${sessionId}`,
    undefined,
    10000
  );
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
  const res = await fetchWithTimeout(`${API_BASE}/wifi-networks`, undefined, 45000);
  if (!res.ok) {
    const backendMessage = await extractBackendMessage(res);
    throw new Error(backendMessage || "Erreur lors du chargement des réseaux Wi-Fi");
  }
  return res.json();
}

export async function configureWifi(
  ssid: string,
  password: string
): Promise<WifiConfigResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/wifi-config`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ssid, password }),
    },
    45000
  );
  if (!res.ok) {
    const backendMessage = await extractBackendMessage(res);
    throw new Error(backendMessage || "Erreur lors de la connexion Wi-Fi");
  }
  return res.json();
}

export async function sendEmail(
  email: string,
  image: string
): Promise<SendEmailResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/send-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, image }),
    },
    45000
  );

  if (!res.ok) {
    const backendMessage = await extractBackendMessage(res);
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
  const res = await fetchWithTimeout(
    `${API_BASE}/frame-upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageDataUrl }),
    },
    30000
  );
  if (!res.ok) {
    const backendMessage = await extractBackendMessage(res);
    throw new Error(backendMessage || "Erreur lors de l'enregistrement du cadre");
  }
  return res.json();
}

export async function printPhoto(image: string): Promise<PrintPhotoResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/print-photo`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    },
    60000
  );
  if (!res.ok) {
    const backendMessage = await extractBackendMessage(res);
    throw new Error(backendMessage || "Erreur lors de l'impression");
  }
  return res.json();
}

export interface UpdateFrontendResponse {
  success: boolean;
  message?: string;
  reloadDelayMs?: number;
}

export interface TrashPhotosResponse {
  success: boolean;
  message?: string;
}

export async function trashPhotos(): Promise<TrashPhotosResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/trash-photos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    10000
  );
  if (!res.ok) {
    const backendMessage = await extractBackendMessage(res);
    throw new Error(backendMessage || "Erreur lors de la mise à la corbeille");
  }
  return res.json();
}

function isAbortLikeError(err: unknown): boolean {
  if (err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError")) return true;
  const message = err instanceof Error ? err.message : String(err);
  const normalized = message.toLowerCase();
  return normalized.includes("abort") || normalized.includes("aborted") || normalized.includes("signal is aborted");
}

function isNetworkInterruption(err: unknown): boolean {
  if (isAbortLikeError(err)) return true;
  const message = err instanceof Error ? err.message : String(err);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed") ||
    normalized.includes("connection") ||
    normalized.includes("econnreset")
  );
}

function updateStartedFallback(): UpdateFrontendResponse {
  return {
    success: true,
    message:
      "Mise à jour lancée. La connexion peut se couper pendant le pull/build/redémarrage — rechargez dans quelques minutes si la page ne revient pas seule.",
    reloadDelayMs: 90000,
  };
}

export async function updateFrontend(): Promise<UpdateFrontendResponse> {
  const request = fetch(`${API_BASE}/update-frontend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    keepalive: true,
  }).then(async (res) => {
    if (!res.ok) {
      const backendMessage = await extractBackendMessage(res);
      throw new Error(backendMessage || "Erreur lors de la mise à jour depuis GitHub");
    }

    const text = await res.text();
    if (!text) return { success: true, message: "Mise à jour lancée.", reloadDelayMs: 3000 };

    try {
      return { reloadDelayMs: 3000, ...JSON.parse(text) } as UpdateFrontendResponse;
    } catch {
      return { success: true, message: text, reloadDelayMs: 3000 };
    }
  });

  const optimisticStart = new Promise<UpdateFrontendResponse>((resolve) => {
    window.setTimeout(() => resolve(updateStartedFallback()), 15000);
  });

  try {
    return await Promise.race([request, optimisticStart]);
  } catch (err) {
    if (isNetworkInterruption(err)) {
      return updateStartedFallback();
    }
    throw err;
  }
}

export interface AppConfig {
  googleDriveUrl?: string;
  [key: string]: unknown;
}

export async function getConfig(): Promise<AppConfig> {
  const res = await fetchWithTimeout(`${API_BASE}/config`, undefined, 10000);
  if (!res.ok) throw new Error("Erreur lors du chargement de la configuration");
  return res.json();
}

export async function saveConfig(config: Partial<AppConfig>): Promise<AppConfig> {
  const res = await fetchWithTimeout(
    `${API_BASE}/config`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    },
    10000
  );
  if (!res.ok) {
    const backendMessage = await extractBackendMessage(res);
    throw new Error(backendMessage || "Erreur lors de la sauvegarde de la configuration");
  }
  return res.json();
}
