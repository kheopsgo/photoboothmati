import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useKeepScreenAwake } from "@/lib/wakeLock";

function Probe({ enabled }: { enabled: boolean }) {
  useKeepScreenAwake(enabled);
  return null;
}

afterEach(() => {
  vi.clearAllMocks();
  delete (navigator as any).wakeLock;
});

describe("useKeepScreenAwake", () => {
  it("acquires the wake lock when enabled and releases it on unmount", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const addEventListener = vi.fn();
    const request = vi.fn().mockResolvedValue({ release, addEventListener });
    (navigator as any).wakeLock = { request };

    const { unmount } = render(<Probe enabled={true} />);
    await act(async () => {});
    expect(request).toHaveBeenCalledWith("screen");

    unmount();
    await act(async () => {});
    expect(release).toHaveBeenCalled();
  });

  it("does not request anything when disabled", () => {
    const request = vi.fn();
    (navigator as any).wakeLock = { request };

    const { unmount } = render(<Probe enabled={false} />);
    unmount();
    expect(request).not.toHaveBeenCalled();
  });

  it("re-acquires the lock when the tab becomes visible again", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const addEventListener = vi.fn();
    const request = vi.fn().mockResolvedValue({ release, addEventListener });
    (navigator as any).wakeLock = { request };

    const { unmount } = render(<Probe enabled={true} />);
    await act(async () => {});
    expect(request).toHaveBeenCalledTimes(1);

    // Simulate the browser dropping the lock, then the tab becoming visible.
    addEventListener.mock.calls.at(-1)?.[1]();
    await act(async () => {});
    expect(request).toHaveBeenCalledTimes(2);

    unmount();
  });
});
