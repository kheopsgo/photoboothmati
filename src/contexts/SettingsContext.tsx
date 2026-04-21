import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { EventConfig } from "@/config/eventConfig";
import defaultEventConfig from "@/config/eventConfig";

export interface AppSettings {
  /** Allow single photo mode */
  allowSingle: boolean;
  /** Allow four photos mode */
  allowFour: boolean;
  /** Show filter selection screen */
  filtersEnabled: boolean;
  /** Show frame on result */
  frameEnabled: boolean;
  /** Event config for frame & branding */
  eventConfig: EventConfig;
  /** Milliseconds the real /take-photo call is fired before the visual end of the countdown */
  captureOffsetMs: number;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  updateEventConfig: (partial: Partial<EventConfig>) => void;
}

const defaultSettings: AppSettings = {
  allowSingle: true,
  allowFour: true,
  filtersEnabled: true,
  frameEnabled: true,
  eventConfig: { ...defaultEventConfig },
  captureOffsetMs: 1500,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("photobooth-settings");
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return defaultSettings;
  });

  const persist = useCallback((s: AppSettings) => {
    try { localStorage.setItem("photobooth-settings", JSON.stringify(s)); } catch { /* ignore */ }
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateEventConfig = useCallback((partial: Partial<EventConfig>) => {
    setSettings((prev) => {
      const next = { ...prev, eventConfig: { ...prev.eventConfig, ...partial } };
      persist(next);
      return next;
    });
  }, [persist]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateEventConfig }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}
