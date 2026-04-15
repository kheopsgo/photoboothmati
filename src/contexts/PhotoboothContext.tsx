import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { PhotoMode, PhotoFilter } from "@/services/api";

export type Screen =
  | "welcome"
  | "mode"
  | "filter"
  | "countdown"
  | "capturing"
  | "result"
  | "share";

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
  setQrUrl: (url: string) => void;
  setEmailStatus: (s: PhotoboothState["emailStatus"]) => void;
  setCaptureProgress: (n: number) => void;
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
        setQrUrl,
        setEmailStatus,
        setCaptureProgress,
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
