import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { useProgress } from "@/hooks/useProgress";

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("useProgress", () => {
  it("fetchProgress calls GET /progress", async () => {
    const progressData = [
      { skill: "reading", level: 5 },
      { skill: "listening", level: 3 },
    ];
    mockApi.get.mockResolvedValue(progressData);
    const { result } = renderHook(() => useProgress());

    await act(async () => {
      await result.current.fetchProgress();
    });

    expect(mockApi.get).toHaveBeenCalledWith("/progress");
    expect(result.current.progress).toEqual(progressData);
  });

  it("fetchProgress sets loading states", async () => {
    let resolve: (v: any) => void;
    mockApi.get.mockImplementation(
      () => new Promise((r) => (resolve = r))
    );
    const { result } = renderHook(() => useProgress());

    expect(result.current.loading).toBe(false);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.fetchProgress();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolve!([]);
      await promise!;
    });

    expect(result.current.loading).toBe(false);
  });

  it("fetchJlptComparison calls GET /progress/jlpt_comparison", async () => {
    const jlptData = { level: "N3", coverage: 0.72 };
    mockApi.get.mockResolvedValue(jlptData);
    const { result } = renderHook(() => useProgress());

    await act(async () => {
      await result.current.fetchJlptComparison();
    });

    expect(mockApi.get).toHaveBeenCalledWith(
      "/progress/jlpt_comparison?language_code=ja"
    );
    expect(result.current.jlptData).toEqual(jlptData);
  });

  it("fetchJlptComparison uses provided language code", async () => {
    mockApi.get.mockResolvedValue({});
    const { result } = renderHook(() => useProgress());

    await act(async () => {
      await result.current.fetchJlptComparison("ko");
    });

    expect(mockApi.get).toHaveBeenCalledWith(
      "/progress/jlpt_comparison?language_code=ko"
    );
  });

  it("sets error on fetchProgress failure", async () => {
    mockApi.get.mockRejectedValue(new Error("Connection refused"));
    const { result } = renderHook(() => useProgress());

    await act(async () => {
      await result.current.fetchProgress();
    });

    expect(result.current.error).toBe("Connection refused");
    expect(result.current.progress).toEqual([]);
  });

  it("sets error on fetchJlptComparison failure", async () => {
    mockApi.get.mockRejectedValue(new Error("JLPT error"));
    const { result } = renderHook(() => useProgress());

    await act(async () => {
      await result.current.fetchJlptComparison();
    });

    expect(result.current.error).toBe("JLPT error");
  });
});
