import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PhotoFrame from "@/components/photobooth/PhotoFrame";

vi.mock("@/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      eventConfig: {
        frameStyle: "elegant",
        monogram: "A & B",
        title: "Alice & Baptiste",
        subtitle: "12 Juillet 2026",
        footer: "Merci",
      },
    },
  }),
}));

describe("PhotoFrame", () => {
  it("affiche les infos de l'événement sous la zone photo paysage (3:2)", () => {
    const { container } = render(
      <PhotoFrame variant="single">
        <div>PHOTO</div>
      </PhotoFrame>
    );

    const slot = container.querySelector("[data-frame-photo-slot]") as HTMLElement;
    expect(slot).not.toBeNull();

    // La zone photo est paysage 3:2
    expect(slot.className).toContain("aspect-[3/2]");

    // Les infos viennent APRÈS la zone photo dans l'ordre du DOM (sous la photo)
    const title = Array.from(container.querySelectorAll("p")).find(
      (p) => p.textContent === "Alice & Baptiste"
    );
    expect(title).not.toBeNull();
    expect(
      slot.compareDocumentPosition(title as Node) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
