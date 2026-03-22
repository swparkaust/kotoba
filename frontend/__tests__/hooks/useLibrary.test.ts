import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { useLibrary } from "@/hooks/useLibrary";

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("useLibrary", () => {
  it("fetchRecommended calls GET /library with recommended=true", async () => {
    mockApi.get.mockResolvedValue([{ id: 1, title: "Test" }]);
    const { result } = renderHook(() => useLibrary());

    await act(async () => {
      await result.current.fetchRecommended();
    });

    expect(mockApi.get).toHaveBeenCalledWith(
      "/library?recommended=true&language_code=ja"
    );
    expect(result.current.items).toEqual([{ id: 1, title: "Test" }]);
  });

  it("fetchRecommended uses provided language code", async () => {
    mockApi.get.mockResolvedValue([]);
    const { result } = renderHook(() => useLibrary());

    await act(async () => {
      await result.current.fetchRecommended("ko");
    });

    expect(mockApi.get).toHaveBeenCalledWith(
      "/library?recommended=true&language_code=ko"
    );
  });

  it("fetchStats calls GET /library/reading_stats", async () => {
    const statsData = { totalMinutes: 120, booksRead: 5 };
    mockApi.get.mockResolvedValue(statsData);
    const { result } = renderHook(() => useLibrary());

    await act(async () => {
      await result.current.fetchStats();
    });

    expect(mockApi.get).toHaveBeenCalledWith("/library/reading_stats");
    expect(result.current.stats).toEqual(statsData);
  });

  it("sets loading true during fetch and false after", async () => {
    let resolve: (v: any) => void;
    mockApi.get.mockImplementation(
      () => new Promise((r) => (resolve = r))
    );
    const { result } = renderHook(() => useLibrary());

    expect(result.current.loading).toBe(false);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.fetchRecommended();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolve!([]);
      await promise!;
    });

    expect(result.current.loading).toBe(false);
  });

  it("sets error on fetch failure", async () => {
    mockApi.get.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useLibrary());

    await act(async () => {
      await result.current.fetchRecommended();
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.items).toEqual([]);
  });

  it("fetchByLevel calls GET with level params", async () => {
    mockApi.get.mockResolvedValue([{ id: 2 }]);
    const { result } = renderHook(() => useLibrary());

    await act(async () => {
      await result.current.fetchByLevel(1, 5, "article");
    });

    expect(mockApi.get).toHaveBeenCalledWith(
      "/library?language_code=ja&level_min=1&level_max=5&item_type=article"
    );
    expect(result.current.items).toEqual([{ id: 2 }]);
  });
});
