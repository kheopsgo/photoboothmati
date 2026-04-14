// Mock API service — replace with real Raspberry Pi endpoints later

const API_BASE = "";

export type PhotoMode = "single" | "four";
export type PhotoFilter = "none" | "bw" | "sepia";

export interface TakePhotoResponse {
  sessionId: string;
  photos: string[];
  finalImage: string;
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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Placeholder image generator
const placeholderPhoto = (id: string, index: number) =>
  `https://picsum.photos/seed/${id}_${index}/600/800`;

export async function takePhoto(
  mode: PhotoMode,
  filter: PhotoFilter
): Promise<TakePhotoResponse> {
  // Mock implementation
  await delay(1500);

  const sessionId = Math.random().toString(36).substring(2, 8);
  const count = mode === "single" ? 1 : 4;
  const photos = Array.from({ length: count }, (_, i) =>
    placeholderPhoto(sessionId, i + 1)
  );

  return {
    sessionId,
    photos,
    finalImage: photos[0],
  };
}

export async function getLatestPhoto(
  sessionId: string
): Promise<LatestPhotoResponse> {
  await delay(800);

  return {
    sessionId,
    photos: [placeholderPhoto(sessionId, 1)],
    finalImage: placeholderPhoto(sessionId, 1),
    qrUrl: `https://example.com/download/${sessionId}`,
  };
}

export async function sendEmail(
  sessionId: string,
  email: string
): Promise<SendEmailResponse> {
  await delay(1200);

  if (!email || !email.includes("@")) {
    throw new Error("Adresse e-mail invalide");
  }

  return {
    success: true,
    message: "Photo envoyée",
  };
}

// For real backend, replace with:
// export async function takePhoto(mode, filter) {
//   const res = await fetch(`${API_BASE}/take-photo`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ mode, filter }),
//   });
//   if (!res.ok) throw new Error("Erreur lors de la capture");
//   return res.json();
// }
