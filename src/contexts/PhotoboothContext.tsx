import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { PhotoMode, PhotoFilter } from "@/services/api";

export type Screen =
  | "welcome"
  | "mode"
  | "filter"
  | "preview"
  | "countdown"
  | "capturing"
  | "result"
  | "share"
  | "thanks";

interface PhotoboothState {
  screen: Screen;
  mode: PhotoMode | null;
  filter: PhotoFilter;
  sessionId: string | null;
  photos: string[];
  finalImage: string | null;
  qrUrl: string | null;
  emailStatus: "idle" | "sending" | "sent" | "error";
  captureProgress: number; // 0-based: how many photos already captured
}

interface PhotoboothContextType extends PhotoboothState {
  setScreen: (s: Screen) => void;
  setMode: (m: PhotoMode) => void;
  setFilter: (f: PhotoFilter) => void;
  setCaptureResult: (sessionId: string, photos: string[], finalImage: string) => void;
  addCapturedPhoto: (photo: string, sessionId: string) => void;
  removeLastPhoto: () => void;
  setQrUrl: (url: string) => void;
  setEmailStatus: (s: PhotoboothState["emailStatus"]) => void;
  setCaptureProgress: (n: number) => void;
  resetCaptureSession: () => void;
  restart: () => void;
}

const initial: PhotoboothState = {
  screen: "welcome",
  mode: null,
  filter: "none",
  sessionId: null,
  photos: [],
  finalImage: null,
  qrUrl: null,
  emailStatus: "idle",
  captureProgress: 0,
};

const PhotoboothContext = createContext<PhotoboothContextType | null>(null);

export function PhotoboothProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PhotoboothState>(initial);

  const setScreen = useCallback((screen: Screen) => setState((s) => ({ ...s, screen })), []);
  const setMode = useCallback((mode: PhotoMode) => setState((s) => ({ ...s, mode })), []);
  const setFilter = useCallback((filter: PhotoFilter) => setState((s) => ({ ...s, filter })), []);
  const setCaptureResult = useCallback(
    (sessionId: string, photos: string[], finalImage: string) =>
      setState((s) => ({ ...s, sessionId, photos, finalImage })),
    []
  );
  const addCapturedPhoto = useCallback(
    (photo: string, sessionId: string) =>
      setState((s) => ({
        ...s,
        sessionId,
        photos: [...s.photos, photo],
        finalImage: photo, // latest photo
        captureProgress: s.captureProgress + 1,
      })),
    []
  );
  const removeLastPhoto = useCallback(() => {
    setState((s) => {
      const nextPhotos = s.photos.slice(0, -1);
      return {
        ...s,
        photos: nextPhotos,
        finalImage: nextPhotos[nextPhotos.length - 1] || null,
        captureProgress: Math.max(0, s.captureProgress - 1),
      };
    });
  }, []);
  const setQrUrl = useCallback((qrUrl: string) => setState((s) => ({ ...s, qrUrl })), []);
  const setEmailStatus = useCallback(
    (emailStatus: PhotoboothState["emailStatus"]) =>
      setState((s) => ({ ...s, emailStatus })),
    []
  );
  const setCaptureProgress = useCallback(
    (captureProgress: number) => setState((s) => ({ ...s, captureProgress })),
    []
  );
  const resetCaptureSession = useCallback(
    () =>
      setState((s) => ({
        ...s,
        sessionId: null,
        photos: [],
        finalImage: null,
        qrUrl: null,
        captureProgress: 0,
      })),
    []
  );
  const restart = useCallback(() => setState(initial), []);

  return (
    <PhotoboothContext.Provider
      value={{
        ...state,
        setScreen,
        setMode,
        setFilter,
        setCaptureResult,
        addCapturedPhoto,
        removeLastPhoto,
        setQrUrl,
        setEmailStatus,
        setCaptureProgress,
        resetCaptureSession,
        restart,
      }}
    >
      {children}
    </PhotoboothContext.Provider>
  );
}

export function usePhotobooth() {
  const ctx = useContext(PhotoboothContext);
  if (!ctx) throw new Error("usePhotobooth must be inside PhotoboothProvider");
  return ctx;
}
