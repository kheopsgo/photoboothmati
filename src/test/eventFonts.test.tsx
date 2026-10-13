import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { EVENT_FONT_OPTIONS, getEventFont } from "@/lib/eventFonts";

afterEach(() => { cleanup(); localStorage.clear(); });

describe("event font preferences", () => {
  it("offers exactly the three requested font types", () => {
    expect(EVENT_FONT_OPTIONS.map((option) => option.label)).toEqual(["Stylisée", "Moderne", "Normal"]);
    expect(new Set(EVENT_FONT_OPTIONS.map((option) => option.className)).size).toBe(3);
  });

  it("keeps all five personalized texts independent and restores them after reopening", () => {
    const first = renderHook(() => useSettings(), { wrapper: SettingsProvider });
    act(() => first.result.current.updateEventConfig({ fonts: {
      title: "modern", subtitle: "stylized", monogram: "normal", footer: "modern", welcomeMessage: "stylized",
    } }));
    act(() => first.result.current.updateEventConfig({
      fonts: { ...first.result.current.settings.eventConfig.fonts, title: "normal" },
    }));
    first.unmount();
    const reopened = renderHook(() => useSettings(), { wrapper: SettingsProvider });
    expect(reopened.result.current.settings.eventConfig.fonts).toEqual({
      title: "normal", subtitle: "stylized", monogram: "normal", footer: "modern", welcomeMessage: "stylized",
    });
  });

  it("supports existing settings that have no font preferences", () => {
    expect(getEventFont(undefined, "title")).toBe("stylized");
    expect(getEventFont(undefined, "subtitle")).toBe("normal");
  });
});