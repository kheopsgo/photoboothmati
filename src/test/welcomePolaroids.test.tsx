import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WelcomePolaroids from "@/components/photobooth/WelcomePolaroids";

vi.mock("@/components/photobooth/FinalImage", () => ({
  default: ({ src }: { src: string }) => <img src={src} alt="" />,
}));

afterEach(() => vi.useRealTimers());

describe("welcome Polaroids", () => {
  it("changes the front photo at exactly five seconds", () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<WelcomePolaroids photos={["/one.jpg", "/two.jpg"]} />);
    const front = () => container.querySelector(".welcome-polaroid-0 img")?.getAttribute("src");
    expect(front()).toBe("/one.jpg");
    act(() => vi.advanceTimersByTime(4999));
    expect(front()).toBe("/one.jpg");
    act(() => vi.advanceTimersByTime(1));
    expect(front()).toBe("/two.jpg");
    act(() => vi.advanceTimersByTime(5000));
    expect(front()).toBe("/one.jpg");
    unmount();
  });
});