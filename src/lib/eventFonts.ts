export const EVENT_FONT_OPTIONS = [
  { id: "stylized", label: "Stylisée", className: "event-font-stylized" },
  { id: "modern", label: "Moderne", className: "event-font-modern" },
  { id: "normal", label: "Normal", className: "event-font-normal" },
] as const;

export type EventFont = typeof EVENT_FONT_OPTIONS[number]["id"];
export type EventTextField = "title" | "subtitle" | "monogram" | "footer" | "welcomeMessage";
export type EventFonts = Partial<Record<EventTextField, EventFont>>;

export function getEventFont(fonts: EventFonts | undefined, field: EventTextField): EventFont {
  const chosen = fonts?.[field];
  if (EVENT_FONT_OPTIONS.some((option) => option.id === chosen) && chosen) return chosen;
  return field === "title" || field === "monogram" ? "stylized" : "normal";
}

export function eventFontClass(fonts: EventFonts | undefined, field: EventTextField): string {
  const font = getEventFont(fonts, field);
  return EVENT_FONT_OPTIONS.find((option) => option.id === font)?.className ?? "event-font-normal";
}