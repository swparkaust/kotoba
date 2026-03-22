import { renderHook, act } from "@testing-library/react";

const mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia,
});

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

beforeEach(() => {
  jest.clearAllMocks();
  mockMatchMedia.mockReturnValue({ matches: false });
});

describe("useInstallPrompt", () => {
  it("isInstallable is false initially", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isInstallable).toBe(false);
  });

  it("isInstallable becomes true on beforeinstallprompt event", () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      (event as any).prompt = jest.fn();
      (event as any).userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(event);
    });

    expect(result.current.isInstallable).toBe(true);
  });

  it("promptInstall calls prompt() on deferred event", async () => {
    const mockPrompt = jest.fn();
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      (event as any).prompt = mockPrompt;
      (event as any).userChoice = Promise.resolve({ outcome: "accepted" });
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(mockPrompt).toHaveBeenCalled();
  });

  it("sets isInstalled true when user accepts", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      (event as any).prompt = jest.fn();
      (event as any).userChoice = Promise.resolve({ outcome: "accepted" });
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it("does not set isInstalled when user dismisses", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      (event as any).prompt = jest.fn();
      (event as any).userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(result.current.isInstalled).toBe(false);
  });

  it("detects standalone mode as already installed", () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.isInstalled).toBe(true);
  });

  it("removes event listener on unmount", () => {
    const removeListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useInstallPrompt());

    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith(
      "beforeinstallprompt",
      expect.any(Function)
    );
    removeListenerSpy.mockRestore();
  });
});
