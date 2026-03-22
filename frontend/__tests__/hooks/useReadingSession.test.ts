import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { useReadingSession } from "@/hooks/useReadingSession";

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useReadingSession", () => {
  it("start begins the timer and pause stops it", () => {
    const { result } = renderHook(() => useReadingSession("item-1"));

    expect(result.current.elapsed).toBe(0);

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.elapsed).toBe(3);

    act(() => {
      result.current.pause();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.elapsed).toBe(3);
  });

  it("addGlossCard increments newCardCount", () => {
    const { result } = renderHook(() => useReadingSession("item-1"));

    expect(result.current.newCardCount).toBe(0);

    act(() => {
      result.current.addGlossCard("猫", "cat");
    });

    expect(result.current.newCardCount).toBe(1);

    act(() => {
      result.current.addGlossCard("犬", "dog");
    });

    expect(result.current.newCardCount).toBe(2);
  });

  it("saveSession posts to correct endpoint using refs", async () => {
    mockApi.post.mockResolvedValue({});
    const { result } = renderHook(() => useReadingSession("item-42"));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    act(() => {
      result.current.addGlossCard("本", "book");
    });

    await act(async () => {
      await result.current.saveSession("reading", 50);
    });

    expect(mockApi.post).toHaveBeenCalledWith("/library/item-42/record_session", {
      session_type: "reading",
      duration_seconds: 5,
      words_read: 0,
      progress_pct: 50,
      new_srs_cards: [{ word: "本", definition_ja: "book" }],
    });
  });

  it("saveSession sets error on failure", async () => {
    mockApi.post.mockRejectedValue(new Error("Save failed"));
    const { result } = renderHook(() => useReadingSession("item-1"));

    await act(async () => {
      await result.current.saveSession("listening", 100);
    });

    expect(result.current.error).toBe("Save failed");
  });

  it("clears timer on unmount", () => {
    const { result, unmount } = renderHook(() => useReadingSession("item-1"));

    act(() => {
      result.current.start();
    });

    unmount();

    expect(() => jest.advanceTimersByTime(5000)).not.toThrow();
  });

  it("setWordsRead updates wordsRead and is used in saveSession", async () => {
    mockApi.post.mockResolvedValue({});
    const { result } = renderHook(() => useReadingSession("item-5"));

    expect(result.current.wordsRead).toBe(0);

    act(() => {
      result.current.setWordsRead(42);
    });

    expect(result.current.wordsRead).toBe(42);

    await act(async () => {
      await result.current.saveSession("reading", 75);
    });

    expect(mockApi.post).toHaveBeenCalledWith("/library/item-5/record_session", expect.objectContaining({
      words_read: 42,
    }));
  });

  it("elapsed increments every second via timer", () => {
    const { result } = renderHook(() => useReadingSession("item-timer"));

    expect(result.current.elapsed).toBe(0);

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.elapsed).toBe(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.elapsed).toBe(2);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.elapsed).toBe(5);
  });
});
