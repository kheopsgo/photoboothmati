/**
 * Détection de l'environnement d'exécution.
 * Permet d'adapter le comportement (polling backend, timeouts, etc.)
 * selon qu'on est dans l'éditeur Lovable, en local, ou sur le Raspberry.
 */

const HOTSPOT_HOST = "10.42.0.1";

export function currentHostname(): string {
  if (typeof window === "undefined") return "";
  return window.location.hostname;
}

export function currentPort(): string {
  if (typeof window === "undefined") return "";
  return window.location.port;
}

/** Vrai si on est dans l'éditeur/preview Lovable ou sur localhost de dev. */
export function isPreviewHost(): boolean {
  const h = currentHostname();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.includes("lovable") ||
    h.includes("id-preview--") ||
    h.includes("preview--") ||
    h.endsWith(".lovableproject.com") ||
    h.endsWith(".lovableproject-dev.com") ||
    h.endsWith(".beta.lovable.dev")
  );
}

/** Vrai si on est probablement servi par le Raspberry Pi (hotspot ou réseau local Pi). */
export function isLikelyPiNetwork(): boolean {
  const h = currentHostname();
  const p = currentPort();
  return (
    h === HOTSPOT_HOST ||
    p === "5000" ||
    h.includes("pi.local") ||
    h.endsWith(".local")
  );
}

/** Indique si le backend local est censé être joignable. */
export function shouldExpectLocalBackend(): boolean {
  return isLikelyPiNetwork() || !isPreviewHost();
}
