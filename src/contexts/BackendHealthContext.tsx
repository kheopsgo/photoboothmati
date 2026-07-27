import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { API_BASE } from "@/services/api";
import { isPreviewHost } from "@/lib/environment";

interface BackendHealthContextType {
  /** null = état inconnu (mode preview), true = en ligne, false = hors ligne */
  online: boolean | null;
  /** Force une vérification immédiate. */
  checkNow: () => void;
}

const BackendHealthContext = createContext<BackendHealthContextType>({
  online: true,
  checkNow: () => {},
});

const BASE_POLL_MS = 5000;
const MAX_POLL_MS = 30000;
const PREVIEW_POLL_MS = 30000;
const TIMEOUT_MS = 4000;

export function BackendHealthProvider({ children }: { children: ReactNode }) {
  const preview = isPreviewHost();
  // En preview on ne sait pas si le backend est joignable : on reste neutre.
  const [online, setOnline] = useState<boolean | null>(preview ? null : true);
  const [pollMs, setPollMs] = useState(preview ? PREVIEW_POLL_MS : BASE_POLL_MS);
  const consecutiveFailures = useRef(0);

  const checkNow = useCallback(async () => {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE}/health`, {
        method: "GET",
        signal: ctrl.signal,
        cache: "no-store",
      });
      const ok = res.ok;
      setOnline(ok);
      if (ok) {
        consecutiveFailures.current = 0;
        setPollMs(BASE_POLL_MS);
      } else {
        consecutiveFailures.current += 1;
        setPollMs((ms) => {
          const next = BASE_POLL_MS * Math.pow(2, consecutiveFailures.current);
          return Math.min(next, MAX_POLL_MS);
        });
      }
    } catch {
      setOnline(false);
      consecutiveFailures.current += 1;
      setPollMs((ms) => {
        const next = BASE_POLL_MS * Math.pow(2, consecutiveFailures.current);
        return Math.min(next, MAX_POLL_MS);
      });
    } finally {
      window.clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (preview) return;

    checkNow();
    const id = window.setInterval(checkNow, pollMs);
    return () => window.clearInterval(id);
  }, [checkNow, pollMs, preview]);

  return (
    <BackendHealthContext.Provider value={{ online, checkNow }}>
      {children}
      {online === false && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
          <button
            onClick={checkNow}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-foreground/90 backdrop-blur-md text-background px-5 py-2.5 text-sm shadow-lg active:scale-95 transition-transform"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-full w-2.5 rounded-full bg-destructive" />
            </span>
            Connexion au photobooth perdue — toucher pour réessayer
          </button>
        </div>
      )}
    </BackendHealthContext.Provider>
  );
}

export function useBackendHealth() {
  return useContext(BackendHealthContext);
}
