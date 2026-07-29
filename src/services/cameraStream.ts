import { API_BASE } from "@/services/api";

/**
 * URL unique et stable du flux MJPEG.
 *
 * Objectif : n'ouvrir qu'UNE seule connexion vers /stream.mjpg pour toute la
 * session. Un nonce différent à chaque montage forcerait Chromium à ouvrir une
 * nouvelle connexion (et l'ancienne reste parfois ouverte) → saturation du
 * backend PiCam. On garde donc la même URL tant que personne ne demande
 * explicitement un rafraîchissement.
 */
const RAW_STREAM_URL: string =
  (import.meta.env.VITE_STREAM_URL as string | undefined) || `${API_BASE}/stream.mjpg`;

let nonce = Date.now();

function build(): string {
  return RAW_STREAM_URL.includes("?")
    ? `${RAW_STREAM_URL}&t=${nonce}`
    : `${RAW_STREAM_URL}?t=${nonce}`;
}

let currentUrl = build();

export function getStreamUrl(): string {
  return currentUrl;
}

/** Force une nouvelle connexion (ex. bouton « rafraîchir », caméra réactivée). */
export function refreshStreamUrl(): string {
  nonce = Date.now();
  currentUrl = build();
  return currentUrl;
}
