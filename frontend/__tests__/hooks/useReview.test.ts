import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { useReview } from "@/hooks/useReview";

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("useReview", () => {
  it("fetchDueCards calls GET /reviews", async () => {
    const cards = [{ id: "1" }, { id: "2" }, { id: "3" }];
    mockApi.get.mockResolvedValue(cards);
    const { result } = renderHook(() => useReview());

    await act(async () => {
      await result.current.fetchDueCards();
    });

    expect(mockApi.get).toHaveBeenCalledWith("/reviews");
    expect(result.current.cards).toEqual(cards);
    expect(result.current.remaining).toBe(3);
  });

  it("fetchDueCards passes query params", async () => {
    mockApi.get.mockResolvedValue([]);
    const { result } = renderHook(() => useReview());

    await act(async () => {
      await result.current.fetchDueCards({ level: "5" });
    });

    expect(mockApi.get).toHaveBeenCalledWith("/reviews?level=5");
  });

  it("submitReview calls POST /reviews/:id/submit", async () => {
    mockApi.get.mockResolvedValue([{ id: "c1" }, { id: "c2" }]);
    mockApi.post.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useReview());

    await act(async () => {
      await result.current.fetchDueCards();
    });

    expect(result.current.remaining).toBe(2);

    await act(async () => {
      await result.current.submitReview("c1", true);
    });

    expect(mockApi.post).toHaveBeenCalledWith("/reviews/c1/submit", {
      correct: true,
    });
    expect(result.current.remaining).toBe(1);
  });

  it("remaining count decrements after each submitReview", async () => {
    mockApi.get.mockResolvedValue([{ id: "a" }, { id: "b" }, { id: "c" }]);
    mockApi.post.mockResolvedValue({});
    const { result } = renderHook(() => useReview());

    await act(async () => {
      await result.current.fetchDueCards();
    });

    expect(result.current.remaining).toBe(3);

    await act(async () => {
      await result.current.submitReview("a", true);
    });
    expect(result.current.remaining).toBe(2);

    await act(async () => {
      await result.current.submitReview("b", false);
    });
    expect(result.current.remaining).toBe(1);
  });

  it("currentCard tracks the current index", async () => {
    mockApi.get.mockResolvedValue([{ id: "x" }, { id: "y" }]);
    mockApi.post.mockResolvedValue({});
    const { result } = renderHook(() => useReview());

    await act(async () => {
      await result.current.fetchDueCards();
    });

    expect(result.current.currentCard).toEqual({ id: "x" });

    await act(async () => {
      await result.current.submitReview("x", true);
    });

    expect(result.current.currentCard).toEqual({ id: "y" });
  });

  it("sets error on fetch failure", async () => {
    mockApi.get.mockRejectedValue(new Error("Server error"));
    const { result } = renderHook(() => useReview());

    await act(async () => {
      await result.current.fetchDueCards();
    });

    expect(result.current.error).toBe("Server error");
  });
});
