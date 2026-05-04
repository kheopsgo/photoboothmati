import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { API_BASE } from "@/services/api";

interface BackendHealthContextType {
  online: boolean;
}

const BackendHealthContext = createContext<BackendHealthContextType>({ online: true });

const POLL_MS = 5000;
const TIMEOUT_MS = 4000;

export function BackendHealthProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const ctrl = new AbortController();
      const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(`${API_BASE}/health`, {
          method: "GET",
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (!cancelled) setOnline(res.ok);
      } catch {
        if (!cancelled) setOnline(false);
      } finally {
        window.clearTimeout(t);
      }
    };

    check();
    const id = window.setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <BackendHealthContext.Provider value={{ online }}>
      {children}
      {!online && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="flex items-center gap-2 rounded-full bg-foreground/80 backdrop-blur-md text-background px-4 py-2 text-sm shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
            Connexion au photobooth perdue
          </div>
        </div>
      )}
    </BackendHealthContext.Provider>
  );
}

export function useBackendHealth() {
  return useContext(BackendHealthContext);
}
