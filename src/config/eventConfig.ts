// Event configuration — customize this for each event
// This file centralizes all branding and frame settings

export type EventType = "wedding" | "birthday" | "corporate" | "party" | "custom";

export interface EventConfig {
  type: EventType;
  /** Main title displayed on the frame */
  title: string;
  /** Subtitle or date */
  subtitle: string;
  /** Short monogram or initials (e.g. "A & B") */
  monogram: string;
  /** Optional logo URL — displayed in frame if provided */
  logoUrl?: string;
  /** Frame accent color as HSL string (e.g. "12 45% 62%") — falls back to primary */
  accentColor?: string;
  /** Frame style */
  frameStyle: "elegant" | "minimal" | "botanical" | "geometric" | "polaroid";
  /** Optional small footer text */
  footer?: string;
}

// ✏️ EDIT THIS to match your event
const eventConfig: EventConfig = {
  type: "wedding",
  title: "Alice & Baptiste",
  subtitle: "12 Juillet 2026",
  monogram: "A & B",
  logoUrl: undefined, // replace with URL to logo image
  accentColor: undefined, // uses default rose-gold if undefined
  frameStyle: "elegant",
  footer: "Merci d'avoir partagé ce moment avec nous",
};

export default eventConfig;
