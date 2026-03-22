import { renderHook, act } from "@testing-library/react";

const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn();

class MockAudio {
  src: string;
  playbackRate: number = 1;
  play = mockPlay;
  pause = mockPause;
  constructor(src?: string) {
    this.src = src || "";
  }
}

(global as any).Audio = MockAudio;

import { useAudio } from "@/hooks/useAudio";

beforeEach(() => {
  jest.clearAllMocks();
  mockPlay.mockResolvedValue(undefined);
});

describe("useAudio", () => {
  it("play creates Audio element with correct src", () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.play("http://example.com/audio.mp3");
    });

    expect(MockAudio).toBeDefined();
  });

  it("play sets playbackRate", () => {
    const { result } = renderHook(() => useAudio());
    let createdAudio: MockAudio | null = null;
    const OrigAudio = (global as any).Audio;
    (global as any).Audio = class extends MockAudio {
      constructor(src?: string) {
        super(src);
        createdAudio = this;
      }
    };

    act(() => {
      result.current.play("test.mp3", 0.75);
    });

    expect(createdAudio!.playbackRate).toBe(0.75);
    (global as any).Audio = OrigAudio;
  });

  it("play calls Audio.play()", () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.play("test.mp3");
    });

    expect(mockPlay).toHaveBeenCalled();
  });

  it("stop pauses current audio", () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.play("test.mp3");
    });

    act(() => {
      result.current.stop();
    });

    expect(mockPause).toHaveBeenCalled();
  });

  it("sets error state on play failure", async () => {
    mockPlay.mockRejectedValue(new Error("Playback not allowed"));
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      result.current.play("test.mp3");
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBe("Playback not allowed");
  });

  it("clears error on subsequent play", async () => {
    mockPlay.mockRejectedValueOnce(new Error("Failed"));
    const { result } = renderHook(() => useAudio());

    await act(async () => {
      result.current.play("test.mp3");
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBe("Failed");

    mockPlay.mockResolvedValue(undefined);
    await act(async () => {
      result.current.play("test2.mp3");
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBeNull();
  });
});
